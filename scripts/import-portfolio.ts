/**
 * Import ALAB project portfolio (~37 condo projects in Pattaya) from the
 * source Excel into Supabase. One row = one project (building-level), saved
 * as `visibility = 'draft'` — admins finalize via the Telegram bot, adding
 * unit-level data (photos, exact prices, bedrooms/area per unit).
 *
 * Side effects:
 *   - Auto-inserts missing Pattaya districts into `taxonomy_districts` (RU + EN names)
 *   - Auto-inserts properties with upsert on slug (re-runnable)
 *
 * Usage:
 *   npx tsx scripts/import-portfolio.ts                # writes to DB
 *   npx tsx scripts/import-portfolio.ts --dry-run      # preview only
 */

import { config as dotenvConfig } from 'dotenv'
import * as path from 'node:path'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

// Read Next.js's standard .env.local from the project root.
dotenvConfig({ path: path.resolve(__dirname, '..', '.env.local') })

// ─── 1. Supabase client (service-role bypasses RLS) ───
const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? '').trim()
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── 2. Area → district mapping (Pattaya neighborhoods) ───
//
// The Excel "Area" column mixes street-level addresses (Jomtien Soi 9, Pratumnak
// Hill, etc.) with district names. We normalize them to a fixed slug set so the
// site's filter dropdown stays clean. New districts get auto-created in the
// taxonomy table further down.
const AREA_TO_DISTRICT: Record<string, string> = {
  // Jomtien
  'Jomtien Soi 9': 'jomtien',
  'Jomtien Beach': 'jomtien',
  'Jomtien 2nd Road': 'jomtien',
  'Jomtien 2nd Road (ห่างหาด 200ม.)': 'jomtien',
  'Jomtien': 'jomtien',
  'Thepprasit Soi 9, Jomtien': 'jomtien',
  'Thappraya Soi 15, Jomtien': 'jomtien',
  // Na Jomtien (south of Jomtien proper)
  'Na Jomtien': 'na-jomtien',
  'Na Jomtien (ห่างหาด 200ม.)': 'na-jomtien',
  'Na Jomtien Soi 4': 'na-jomtien',
  // Pratumnak
  'Pratumnak Hill': 'pratumnak',
  'Pratumnak Soi 5': 'pratumnak',
  'Cozy Beach, Pratumnak': 'pratumnak',
  // Wongamat / Naklua
  'Wongamat, Naklua': 'wongamat',
  'Naklua Soi 16, Wongamat': 'wongamat',
  // South Pattaya / Thappraya
  'South Pattaya': 'south-pattaya',
  'Thappraya, South Pattaya': 'south-pattaya',
  'Thappraya Road, South Pattaya': 'south-pattaya',
  'Thappraya Road Soi 15': 'south-pattaya',
  // Central
  'Pattaya 3rd Road': 'central-pattaya',
}

const DISTRICT_NAMES: Record<string, { ru: string; en: string }> = {
  'jomtien':         { ru: 'Джомтьен',          en: 'Jomtien' },
  'na-jomtien':      { ru: 'На Джомтьен',       en: 'Na Jomtien' },
  'pratumnak':       { ru: 'Пратумнак',         en: 'Pratumnak' },
  'wongamat':        { ru: 'Вонгамат',          en: 'Wongamat' },
  'south-pattaya':   { ru: 'Южная Паттайя',     en: 'South Pattaya' },
  'central-pattaya': { ru: 'Центральная Паттайя', en: 'Central Pattaya' },
  'naklua':          { ru: 'Наклуа',            en: 'Naklua' },
}

// Project name transliterations EN → RU. Brand names aren't translated word-by-word —
// they're phonetically rendered the way Russian press / Pattaya forums write them
// (e.g. "Beach" → "Бич", "Tower" → "Тауэр", "Royal" → "Роял").
// Missing entries fall back to the English name in the ru field.
const NAME_TRANSLATIONS: Record<string, string> = {
  'Laguna Beach Resort 1':                    'Лагуна Бич Резорт 1',
  'Laguna Beach Resort 2':                    'Лагуна Бич Резорт 2',
  'Laguna Beach Resort 3 (The Maldives)':     'Лагуна Бич Резорт 3 (Мальдивы)',
  'Park Royal 2':                             'Парк Роял 2',
  'Park Royal 3':                             'Парк Роял 3',
  'Water Park':                               'Уотер Парк',
  'The Peak Towers':                          'Зэ Пик Тауэрс',
  'Laguna Bay 1':                             'Лагуна Бэй 1',
  'Laguna Bay 2':                             'Лагуна Бэй 2',
  'Club Royal':                               'Клаб Роял',
  'Arcadia Beach Resort':                     'Аркадия Бич Резорт',
  'Arcadia Beach Continental':                'Аркадия Бич Континенталь',
  'Arcadia Millennium Tower':                 'Аркадия Миллениум Тауэр',
  'Arcadia Center Suites':                    'Аркадия Центр Сьютс',
  'Whale Marina Condominium':                 'Уэйл Марина Кондоминиум',
  'The Riviera Wongamat Beach':               'Ривьера Вонгамат Бич',
  'The Riviera Jomtien':                      'Ривьера Джомтьен',
  'The Riviera Monaco':                       'Ривьера Монако',
  'The Riviera Ocean Drive':                  'Ривьера Оушен Драйв',
  'Sevenseas Condo Jomtien':                  'Севенсиз Кондо Джомтьен',
  "Sevenseas Côte d'Azur":                    'Севенсиз Кот д\'Азюр',
  'Sevenseas Le Carnival':                    'Севенсиз Ле Карнавал',
  'Grand Solaire':                            'Гранд Соляр',
  'Grand Solaire Noble':                      'Гранд Соляр Нобль',
  'Zenith 1':                                 'Зенит 1',
  'Zenith 2':                                 'Зенит 2',
  'Siam Oriental Oasis':                      'Сиам Ориентал Оазис',
  'Siam Oriental Beach':                      'Сиам Ориентал Бич',
  'Embassy Condominium':                      'Эмбасси Кондоминиум',
  'Embassy Life':                             'Эмбасси Лайф',
  'Greenland Park':                           'Гринлэнд Парк',
  'The Riviera Malibu Residences':            'Ривьера Малибу Резиденс',
  'The Riviera Santa Monica':                 'Ривьера Санта Моника',
  'The Riviera California':                   'Ривьера Калифорния',
  'The Riviera Beverly Hills Residences':     'Ривьера Беверли Хиллз Резиденс',
  'The Riviera Palm Beach Wongamat':          'Ривьера Палм Бич Вонгамат',
  'Sky Park Lucean Jomtien Pattaya':          'Скай Парк Лусеан Джомтьен Паттайя',
}

// ─── 3. Parsers ───

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .split('').map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Extract the first 4-digit year from strings like "2015", "2015-2016", "Q4 2028". */
function parseYear(raw: string | null): number | null {
  if (!raw) return null
  const m = String(raw).match(/(20\d{2})/)
  return m ? Number(m[1]) : null
}

/** Parse "฿1.67M+" → 1670000, "฿9M+" → 9000000, "-" → 0. */
function parseStartingPrice(raw: string | null): number {
  if (!raw || raw === '-') return 0
  const m = String(raw).match(/([\d.]+)\s*([mMкKтT]?)/)
  if (!m) return 0
  const n = parseFloat(m[1])
  if (!Number.isFinite(n)) return 0
  const suffix = m[2].toLowerCase()
  if (suffix === 'm' || suffix === 'м' || suffix === 'т') return Math.round(n * 1_000_000)
  if (suffix === 'k' || suffix === 'к') return Math.round(n * 1_000)
  return Math.round(n)
}

function parseInt0(raw: string | null): number | null {
  if (!raw) return null
  const n = Number(String(raw).replace(/[^\d-]/g, ''))
  return Number.isFinite(n) ? n : null
}

interface XlsxRow {
  "Project's Name"?: string | null
  Developer?: string | null
  Area?: string | null
  'Total Units'?: string | null
  'Total Floors'?: string | null
  'Total Building'?: string | null
  'Complete years'?: string | null
  Status?: string | null
  'Starting Price'?: string | null
  Ownership?: string | null
  Remarks?: string | null
}

interface PropertyInsert {
  id: string
  slug: string
  price_thb: number
  deal: 'sale'
  name: { ru: string; en: string }
  type: 'condo'
  city: 'pattaya'
  district: string | null
  address: { ru: string; en: string } | null
  area_sqm: number
  bedrooms: number
  bathrooms: number
  floor: number | null
  total_floors: number | null
  year_built: number | null
  ownership: 'freehold' | 'leasehold'
  status: 'available'
  description: { ru: string; en: string }
  amenities: string[]
  tags: string[]
  cover_image: string
  gallery: string[]
  developer: { ru: string; en: string } | null
  completion_date: string | null
  featured: boolean
  visibility: 'draft'
}

function buildRow(r: XlsxRow, idx: number): PropertyInsert | null {
  const name = (r["Project's Name"] ?? '').trim()
  if (!name) return null

  const slug = slugify(name)
  const id = slug

  // Area → district. Unknown areas → null (admin fills via bot later).
  const areaRaw = (r.Area ?? '').trim()
  const district = AREA_TO_DISTRICT[areaRaw] ?? null

  // Ownership: "Freehold/Leasehold" → primary value 'freehold'; the secondary
  // option goes into the bot's manual flow later. We do NOT auto-tag the
  // dual-availability because per operator instruction tags are admin-set.
  const ownershipRaw = (r.Ownership ?? '').trim().toLowerCase()
  let ownership: 'freehold' | 'leasehold' = 'freehold'
  if (ownershipRaw === 'leasehold') ownership = 'leasehold'

  // Russian rendition of the brand name. Falls through to the English name if
  // not pre-translated (any future spreadsheet additions will surface as
  // untranslated until added to NAME_TRANSLATIONS).
  const nameRu = NAME_TRANSLATIONS[name] ?? name

  const developer = (r.Developer ?? '').trim()
  const completion = (r['Complete years'] ?? '').trim()

  return {
    id,
    slug,
    price_thb: parseStartingPrice(r['Starting Price'] ?? null),
    deal: 'sale',
    name: { ru: nameRu, en: name },
    type: 'condo',
    city: 'pattaya',
    district,
    address: areaRaw ? { ru: areaRaw, en: areaRaw } : null,
    area_sqm: 0,    // placeholder — bot fills from unit data
    bedrooms: 0,
    bathrooms: 0,
    floor: 0,
    total_floors: parseInt0(r['Total Floors'] ?? null),
    year_built: parseYear(r['Complete years'] ?? null),
    ownership,
    status: 'available',
    // Description left empty by design — admin populates per-unit via the bot.
    // All structured facts (year, floors, ownership, etc.) live in their own
    // fields and render in the page's specs strip, so duplicating them in
    // prose just creates content-quality noise.
    description: { ru: '', en: '' },
    amenities: [],
    tags: [], // not auto-set; admin assigns via bot
    cover_image: '',
    gallery: [],
    developer: developer ? { ru: developer, en: developer } : null,
    completion_date: completion || null,
    featured: false,
    visibility: 'draft',
  }
}

// ─── 4. Main ───

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const file = path.resolve(__dirname, 'source.xlsx')
  console.log(`📥 Reading ${file}`)
  const wb = XLSX.readFile(file)
  const ws = wb.Sheets['Portfolio Overview']
  if (!ws) {
    console.error('❌ Sheet "Portfolio Overview" not found')
    process.exit(1)
  }

  // Headers are in row index 2 (rows 0 + 1 are Thai/English titles).
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { defval: null, raw: false, header: 1 })
  const headers = grid[2] as (string | null)[]
  const dataRows = grid.slice(3).map((arr) => {
    const obj: Record<string, string | null> = {}
    headers.forEach((h, i) => { if (h) obj[h] = (arr as (string | null)[])[i] })
    return obj as XlsxRow
  })
  console.log(`   → ${dataRows.length} data rows raw`)

  // Build property inserts, skipping rows without a Project's Name (summary rows
  // at the bottom of the sheet like "37 Projects", "22,000+ Units").
  const built: PropertyInsert[] = []
  const skipped: string[] = []
  dataRows.forEach((r, idx) => {
    const row = buildRow(r, idx)
    if (row) built.push(row)
    else skipped.push(`row ${idx + 4}: no project name (${JSON.stringify(r).slice(0, 100)})`)
  })
  console.log(`   → ${built.length} valid project rows, ${skipped.length} skipped (summary/empty)`)

  // Collect districts that need to be added to taxonomy.
  const districtsInUse = [...new Set(built.map((p) => p.district).filter((d): d is string => !!d))]
  console.log(`   → districts referenced: ${districtsInUse.join(', ')}`)

  // Preview first row.
  console.log('\n🔍 First parsed property:')
  console.log(JSON.stringify(built[0], null, 2))

  if (dryRun) {
    console.log(`\n--dry-run set — would upsert ${built.length} properties, ${districtsInUse.length} districts.`)
    console.log('All project names:')
    built.forEach((p, i) => console.log(`  ${i + 1}. ${p.name.en}  [${p.district ?? 'no-district'}]  ${p.price_thb > 0 ? `฿${p.price_thb.toLocaleString()}` : '(no price)'}  ${p.tags.join(',')}`))
    return
  }

  // ─── A. Upsert districts ───
  console.log(`\n🚀 Upserting ${districtsInUse.length} districts into taxonomy_districts...`)
  const districtRows = districtsInUse.map((slug) => ({
    slug,
    name: DISTRICT_NAMES[slug] ?? { ru: slug, en: slug },
    city_slug: 'pattaya',
  }))
  const { error: dErr } = await supabase
    .from('taxonomy_districts')
    .upsert(districtRows, { onConflict: 'slug' })
  if (dErr) {
    console.error(`❌ District upsert failed:`, dErr.message, dErr.details, dErr.hint)
    process.exit(1)
  }
  console.log(`   ✓ Districts done`)

  // ─── B. Upsert properties (batched) ───
  console.log(`\n🚀 Upserting ${built.length} properties into properties...`)
  const BATCH = 25
  let written = 0
  for (let i = 0; i < built.length; i += BATCH) {
    const slice = built.slice(i, i + BATCH)
    const { error, count } = await supabase
      .from('properties')
      .upsert(slice, { onConflict: 'slug', count: 'exact' })
    if (error) {
      console.error(`❌ Batch ${i / BATCH + 1} failed:`, error.message, error.details, error.hint)
      process.exit(1)
    }
    written += count ?? slice.length
    console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${slice.length} rows`)
  }
  console.log(`\n✅ Done. ${written} properties upserted as visibility="draft".`)
  console.log(`   Customer/admin now opens each in Telegram to add photos, prices per unit, and publish.`)
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err)
  process.exit(1)
})
