/**
 * Bulk-import properties from an Excel file into Supabase.
 *
 * Workflow:
 *   1. Operator (you) prepares a .xlsx with one property per row.
 *   2. This script reads it, transforms each row into a `properties` insert,
 *      and upserts via the service-role client (bypasses RLS).
 *   3. Imported rows are saved as `visibility = 'draft'` — they're NOT public
 *      yet. Customers/admins then open them in the Telegram bot to upload
 *      photos and finalize, then flip to `published`.
 *
 * Usage:
 *   1. Add deps: npm i -D xlsx tsx
 *   2. Make sure .env.local has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   3. Run: npx tsx scripts/import-properties.ts ./properties.xlsx
 *      Optional: --dry-run prints what would happen without writing.
 *
 * On column names — adjust COLUMN_MAP below to match YOUR Excel headers.
 * Send me the file and I'll wire it up; defaults here are placeholder labels.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

// ───────────────────────── 1. CONFIG ─────────────────────────
//
// Map your Excel HEADERS (left side = our internal field, right side = column
// header as it literally appears in row 1 of the .xlsx). Case-sensitive.
//
// If a column isn't in your sheet, leave the right side as null and a default
// is used (or null is stored).
const COLUMN_MAP = {
  // Identifying
  slug:         'slug',              // optional — auto-generated from name if blank
  code:         'code',              // optional — DB trigger generates if NULL

  // Bilingual fields — provide both _ru and _en when possible.
  // If only one is provided, the other locale falls back to it.
  name_ru:      'Название (RU)',
  name_en:      'Name (EN)',
  description_ru: 'Описание (RU)',
  description_en: 'Description (EN)',
  address_ru:   'Адрес (RU)',
  address_en:   'Address (EN)',
  view_ru:      'Вид из окна (RU)',
  view_en:      'View (EN)',
  developer_ru: 'Застройщик (RU)',
  developer_en: 'Developer (EN)',

  // Classification (must match taxonomy slugs — see Settings below)
  type:         'Тип',                // condo | villa | penthouse | townhouse | house | land | commercial | office | retail | hotel
  city:         'Город',              // bangkok | pattaya | ...
  district:     'Район',              // sukhumvit | silom | ...

  // Numeric specs
  price_thb:    'Цена (THB)',
  area_sqm:     'Площадь (м²)',
  bedrooms:     'Спальни',
  bathrooms:    'Ванные',
  floor:        'Этаж',
  total_floors: 'Всего этажей',
  year_built:   'Год постройки',

  // Ownership
  deal:         'Тип сделки',         // sale | rent (default: sale)
  ownership:    'Форма собственности', // freehold | leasehold (default: freehold)
  lease_years_remaining: 'Срок лизхолда',

  // Status
  status:       'Статус',              // available | reserved | sold (default: available)
  featured:     'Featured',            // 1/0, yes/no, true/false

  // Comma-separated lists
  amenities:    'Amenities',           // e.g. "pool,gym,parking"
  tags:         'Tags',                // e.g. "investor-pick,sea-view"

  // Coordinates (decimal). If blank, map falls back to address geocode.
  lat:          'Широта',
  lng:          'Долгота',

  // Investment numbers
  estimated_monthly_rent_thb: 'Аренда в месяц (THB)',
  estimated_annual_appreciation_pct: 'Рост в год (%)',

  // Completion date for off-plan
  completion_date: 'Сдача',
} as const

// Defaults applied when a column is missing or empty.
const DEFAULTS = {
  deal: 'sale' as const,
  ownership: 'freehold' as const,
  status: 'available' as const,
  visibility: 'draft' as const, // ← IMPORTANT: not public until customer adds photos via bot
  bedrooms: 0,
  bathrooms: 0,
}

// Allowed taxonomy values. Rows with unknown values are flagged but still
// imported — admin can fix in the bot. To enforce strict matching, set
// STRICT_TAXONOMY = true and bad rows will be skipped instead.
const ALLOWED_TYPES = new Set([
  'condo', 'villa', 'penthouse', 'townhouse', 'house', 'land',
  'commercial', 'office', 'retail', 'hotel',
])
const STRICT_TAXONOMY = false

// ───────────────────────── 2. CLIENT ─────────────────────────

const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? '').trim()

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)

// ───────────────────────── 3. HELPERS ─────────────────────────

/** Russian → Latin transliteration table for slug generation. */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function slugify(input: string): string {
  const lowered = String(input ?? '').toLowerCase().trim()
  const latin = lowered
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
  return latin
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'property'
}

/** Build a JSONB {ru, en} value, falling back across locales when one is empty. */
function localized(ru: unknown, en: unknown): { ru: string; en: string } | null {
  const r = typeof ru === 'string' ? ru.trim() : ''
  const e = typeof en === 'string' ? en.trim() : ''
  if (!r && !e) return null
  return { ru: r || e, en: e || r }
}

/** Coerce Excel cell → number, returning null for blanks/garbage. */
function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[\s,]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Coerce truthy strings to boolean ("yes", "true", "1", "✓", "да"). */
function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  const s = String(v ?? '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'y', 'да', '✓', 'x'].includes(s)
}

/** "pool, gym, parking" → ["pool", "gym", "parking"] */
function csvList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  return String(v ?? '')
    .split(/[,;|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Read a column from a row using our COLUMN_MAP. */
function col(row: Record<string, unknown>, key: keyof typeof COLUMN_MAP): unknown {
  const header = COLUMN_MAP[key]
  if (!header) return undefined
  return row[header as string]
}

interface PropertyRow {
  id: string
  slug: string
  code: string | null
  price_thb: number
  deal: 'sale' | 'rent'
  name: { ru: string; en: string }
  type: string
  city: string | null
  district: string | null
  address: { ru: string; en: string } | null
  area_sqm: number
  bedrooms: number
  bathrooms: number
  floor: number | null
  total_floors: number | null
  year_built: number | null
  view: { ru: string; en: string } | null
  ownership: 'freehold' | 'leasehold'
  lease_years_remaining: number | null
  status: 'available' | 'reserved' | 'sold'
  description: { ru: string; en: string } | null
  amenities: string[]
  tags: string[]
  cover_image: string
  gallery: string[]
  developer: { ru: string; en: string } | null
  completion_date: string | null
  coordinates: { lat: number; lng: number } | null
  estimated_monthly_rent_thb: number | null
  estimated_annual_appreciation_pct: number | null
  featured: boolean
  visibility: 'published' | 'hidden' | 'draft'
}

function buildPropertyRow(
  raw: Record<string, unknown>,
  index: number,
): { ok: true; row: PropertyRow } | { ok: false; reason: string } {
  const nameRu = String(col(raw, 'name_ru') ?? '').trim()
  const nameEn = String(col(raw, 'name_en') ?? '').trim()
  if (!nameRu && !nameEn) {
    return { ok: false, reason: `row ${index + 2}: missing name (RU and EN both blank)` }
  }
  const name = localized(nameRu, nameEn)!

  const priceVal = num(col(raw, 'price_thb'))
  if (priceVal == null || priceVal <= 0) {
    return { ok: false, reason: `row ${index + 2}: invalid price_thb` }
  }

  const areaVal = num(col(raw, 'area_sqm'))
  if (areaVal == null || areaVal <= 0) {
    return { ok: false, reason: `row ${index + 2}: invalid area_sqm` }
  }

  const typeRaw = String(col(raw, 'type') ?? '').trim().toLowerCase()
  if (!typeRaw) {
    return { ok: false, reason: `row ${index + 2}: missing type` }
  }
  if (STRICT_TAXONOMY && !ALLOWED_TYPES.has(typeRaw)) {
    return { ok: false, reason: `row ${index + 2}: unknown type "${typeRaw}"` }
  }

  // Slug — prefer explicit column, otherwise derive from name + index suffix
  // to avoid collisions between similarly-named units.
  const explicitSlug = String(col(raw, 'slug') ?? '').trim()
  const slug = explicitSlug || `${slugify(nameRu || nameEn)}-${index + 1}`

  // id = slug as the simplest stable identifier. If you'd rather use nanoid,
  // swap here.
  const id = slug

  const dealRaw = String(col(raw, 'deal') ?? '').trim().toLowerCase()
  const deal: 'sale' | 'rent' = dealRaw === 'rent' ? 'rent' : DEFAULTS.deal

  const ownershipRaw = String(col(raw, 'ownership') ?? '').trim().toLowerCase()
  const ownership: 'freehold' | 'leasehold' = ownershipRaw === 'leasehold' ? 'leasehold' : DEFAULTS.ownership

  const statusRaw = String(col(raw, 'status') ?? '').trim().toLowerCase()
  const status: 'available' | 'reserved' | 'sold' =
    statusRaw === 'reserved' || statusRaw === 'sold' ? statusRaw : DEFAULTS.status

  const lat = num(col(raw, 'lat'))
  const lng = num(col(raw, 'lng'))
  const coordinates = lat != null && lng != null ? { lat, lng } : null

  return {
    ok: true,
    row: {
      id,
      slug,
      code: null, // DB trigger generates
      price_thb: priceVal,
      deal,
      name,
      type: typeRaw,
      city: (String(col(raw, 'city') ?? '').trim().toLowerCase() || null),
      district: (String(col(raw, 'district') ?? '').trim().toLowerCase() || null),
      address: localized(col(raw, 'address_ru'), col(raw, 'address_en')),
      area_sqm: areaVal,
      bedrooms: num(col(raw, 'bedrooms')) ?? DEFAULTS.bedrooms,
      bathrooms: num(col(raw, 'bathrooms')) ?? DEFAULTS.bathrooms,
      floor: num(col(raw, 'floor')),
      total_floors: num(col(raw, 'total_floors')),
      year_built: num(col(raw, 'year_built')),
      view: localized(col(raw, 'view_ru'), col(raw, 'view_en')),
      ownership,
      lease_years_remaining: num(col(raw, 'lease_years_remaining')),
      status,
      description: localized(col(raw, 'description_ru'), col(raw, 'description_en')),
      amenities: csvList(col(raw, 'amenities')),
      tags: csvList(col(raw, 'tags')),
      cover_image: '', // ← Customer/admin uploads in Telegram bot
      gallery: [],     // ← Same
      developer: localized(col(raw, 'developer_ru'), col(raw, 'developer_en')),
      completion_date: String(col(raw, 'completion_date') ?? '').trim() || null,
      coordinates,
      estimated_monthly_rent_thb: num(col(raw, 'estimated_monthly_rent_thb')),
      estimated_annual_appreciation_pct: num(col(raw, 'estimated_annual_appreciation_pct')),
      featured: bool(col(raw, 'featured')),
      visibility: DEFAULTS.visibility,
    },
  }
}

// ───────────────────────── 4. MAIN ─────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const filePath = args.find((a) => !a.startsWith('--'))

  if (!filePath) {
    console.error('Usage: npx tsx scripts/import-properties.ts <file.xlsx> [--dry-run]')
    process.exit(1)
  }
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) {
    console.error(`❌ File not found: ${abs}`)
    process.exit(1)
  }

  console.log(`📥 Reading ${abs}`)
  const workbook = XLSX.readFile(abs)
  const firstSheet = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheet]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  console.log(`   → ${rows.length} rows in sheet "${firstSheet}"`)

  const ok: PropertyRow[] = []
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const result = buildPropertyRow(rows[i], i)
    if (result.ok) ok.push(result.row)
    else errors.push(result.reason)
  }

  console.log(`\n📊 Parsed: ${ok.length} valid, ${errors.length} errors`)
  if (errors.length) {
    console.log('\n⚠️  Skipped rows:')
    errors.forEach((e) => console.log('   ', e))
  }
  if (ok.length === 0) {
    console.log('\nNothing to import.')
    process.exit(errors.length ? 1 : 0)
  }

  // Preview the first row so the operator can spot misaligned mappings.
  console.log('\n🔍 First parsed row preview:')
  console.log(JSON.stringify(ok[0], null, 2))

  if (dryRun) {
    console.log('\n--dry-run set — nothing was written to Supabase.')
    return
  }

  // Upsert on `slug` so re-running the script updates existing rows instead of
  // duplicating. Adjust to `id` if your Excel uses stable IDs.
  console.log(`\n🚀 Upserting ${ok.length} rows into Supabase...`)
  // Batched to keep request body small enough for PostgREST limits.
  const BATCH = 50
  let inserted = 0
  for (let i = 0; i < ok.length; i += BATCH) {
    const slice = ok.slice(i, i + BATCH)
    const { error, count } = await supabaseAdmin
      .from('properties')
      .upsert(slice, { onConflict: 'slug', count: 'exact' })
    if (error) {
      console.error(`❌ Batch ${i / BATCH + 1} failed:`, error.message, error.details, error.hint)
      process.exit(1)
    }
    inserted += count ?? slice.length
    console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${slice.length} rows`)
  }

  console.log(`\n✅ Done. ${inserted} rows upserted as visibility="${DEFAULTS.visibility}".`)
  console.log(`   Customer/admin now opens each in the Telegram bot to add photos and publish.`)
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err)
  process.exit(1)
})
