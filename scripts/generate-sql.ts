/**
 * Same logic as import-portfolio.ts but emits SQL instead of writing to DB.
 * Output is paste-ready for Supabase Studio → SQL Editor.
 */

import * as path from 'node:path'
import * as fs from 'node:fs'
import * as XLSX from 'xlsx'

const AREA_TO_DISTRICT: Record<string, string> = {
  'Jomtien Soi 9': 'jomtien',
  'Jomtien Beach': 'jomtien',
  'Jomtien 2nd Road': 'jomtien',
  'Jomtien 2nd Road (ห่างหาด 200ม.)': 'jomtien',
  'Jomtien': 'jomtien',
  'Thepprasit Soi 9, Jomtien': 'jomtien',
  'Thappraya Soi 15, Jomtien': 'jomtien',
  'Na Jomtien': 'na-jomtien',
  'Na Jomtien (ห่างหาด 200ม.)': 'na-jomtien',
  'Na Jomtien Soi 4': 'na-jomtien',
  'Pratumnak Hill': 'pratumnak',
  'Pratumnak Soi 5': 'pratumnak',
  'Cozy Beach, Pratumnak': 'pratumnak',
  'Wongamat, Naklua': 'wongamat',
  'Naklua Soi 16, Wongamat': 'wongamat',
  'South Pattaya': 'south-pattaya',
  'Thappraya, South Pattaya': 'south-pattaya',
  'Thappraya Road, South Pattaya': 'south-pattaya',
  'Thappraya Road Soi 15': 'south-pattaya',
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

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
function slugify(s: string): string {
  return s.toLowerCase().trim()
    .split('').map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}
function parseYear(raw: string | null): number | null {
  if (!raw) return null
  const m = String(raw).match(/(20\d{2})/)
  return m ? Number(m[1]) : null
}
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

/** SQL string-quote with single-quote escape. */
function q(v: string | null | undefined): string {
  if (v == null) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}
/** SQL JSONB literal — JSON.stringify then quote. */
function jb(obj: unknown): string {
  if (obj == null) return 'NULL'
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
}
/** SQL text[] literal (we use ARRAY[...] form). */
function arr(items: string[]): string {
  if (items.length === 0) return `'{}'::text[]`
  return `ARRAY[${items.map((s) => q(s)).join(', ')}]::text[]`
}
function n(x: number | null): string {
  return x == null ? 'NULL' : String(x)
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

function main() {
  const file = path.resolve(__dirname, 'source.xlsx')
  const wb = XLSX.readFile(file)
  const ws = wb.Sheets['Portfolio Overview']
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { defval: null, raw: false, header: 1 })
  const headers = grid[2] as (string | null)[]
  const dataRows = grid.slice(3).map((rawArr) => {
    const obj: Record<string, string | null> = {}
    headers.forEach((h, i) => { if (h) obj[h] = (rawArr as (string | null)[])[i] })
    return obj as XlsxRow
  })

  const lines: string[] = []
  lines.push('-- ─────────────────────────────────────────────────────────────')
  lines.push('-- ALAB project portfolio import — 37 condo projects in Pattaya')
  lines.push('-- Auto-generated from "ALAB_Project\'s Detail.xlsx".')
  lines.push('-- Paste into Supabase Studio → SQL Editor and Run.')
  lines.push('-- Re-runnable: ON CONFLICT (slug) DO UPDATE keeps data in sync.')
  lines.push('-- ─────────────────────────────────────────────────────────────')
  lines.push('')

  // 1) Districts upsert (only the 6 used)
  lines.push('-- 1. Districts (city_slug = pattaya, with RU + EN names)')
  lines.push('INSERT INTO taxonomy_districts (slug, name, city_slug) VALUES')
  const districtSlugs = ['jomtien', 'na-jomtien', 'pratumnak', 'wongamat', 'south-pattaya', 'central-pattaya']
  const dRows = districtSlugs.map((s) => `  (${q(s)}, ${jb(DISTRICT_NAMES[s])}, ${q('pattaya')})`)
  lines.push(dRows.join(',\n') + ';')
  lines.push("-- ON CONFLICT clause separated for clarity — uncomment if you want re-runnable district upsert:")
  lines.push("-- ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, city_slug = EXCLUDED.city_slug;")
  lines.push('')

  // 2) Properties upsert
  lines.push('-- 2. Properties (37 rows, all visibility=draft; admin completes via Telegram bot)')
  lines.push('INSERT INTO properties (')
  lines.push('  id, slug, price_thb, deal, name, type, city, district, address,')
  lines.push('  area_sqm, bedrooms, bathrooms, floor, total_floors, year_built,')
  lines.push('  ownership, status, description, amenities, tags, cover_image, gallery,')
  lines.push('  developer, completion_date, featured, visibility')
  lines.push(') VALUES')

  const valueLines: string[] = []
  let underConstructionCount = 0

  for (const r of dataRows) {
    const name = (r["Project's Name"] ?? '').trim()
    if (!name) continue
    const slug = slugify(name)
    const id = slug
    const areaRaw = (r.Area ?? '').trim()
    const district = AREA_TO_DISTRICT[areaRaw] ?? null
    const ownershipRaw = (r.Ownership ?? '').trim().toLowerCase()
    const ownership = ownershipRaw === 'leasehold' ? 'leasehold' : 'freehold'
    const nameRu = NAME_TRANSLATIONS[name] ?? name
    const developer = (r.Developer ?? '').trim()
    const completion = (r['Complete years'] ?? '').trim()
    const statusRaw = (r.Status ?? '').trim()
    const isUnderConstruction = statusRaw.includes('Construction')
    if (isUnderConstruction) underConstructionCount++
    const yearBuilt = isUnderConstruction ? null : parseYear(completion)

    const cols = [
      q(id),
      q(slug),
      n(parseStartingPrice(r['Starting Price'] ?? null)),
      q('sale'),
      jb({ ru: nameRu, en: name }),
      q('condo'),
      q('pattaya'),
      q(district),
      areaRaw ? jb({ ru: areaRaw, en: areaRaw }) : 'NULL',
      '0',  // area_sqm placeholder
      '0',  // bedrooms
      '0',  // bathrooms
      '0',  // floor
      n(parseInt0(r['Total Floors'] ?? null)),
      n(yearBuilt),
      q(ownership),
      q('available'),
      jb({ ru: '', en: '' }),
      arr([]),  // amenities
      arr([]),  // tags
      q(''),    // cover_image
      arr([]),  // gallery
      developer ? jb({ ru: developer, en: developer }) : 'NULL',
      completion ? q(completion) : 'NULL',
      'false',
      q('draft'),
    ]
    valueLines.push(`  (${cols.join(', ')})`)
  }

  lines.push(valueLines.join(',\n'))
  lines.push('ON CONFLICT (slug) DO UPDATE SET')
  lines.push('  price_thb = EXCLUDED.price_thb,')
  lines.push('  name = EXCLUDED.name,')
  lines.push('  type = EXCLUDED.type,')
  lines.push('  city = EXCLUDED.city,')
  lines.push('  district = EXCLUDED.district,')
  lines.push('  address = EXCLUDED.address,')
  lines.push('  total_floors = EXCLUDED.total_floors,')
  lines.push('  year_built = EXCLUDED.year_built,')
  lines.push('  ownership = EXCLUDED.ownership,')
  lines.push('  description = EXCLUDED.description,')
  lines.push('  tags = EXCLUDED.tags,')
  lines.push('  developer = EXCLUDED.developer,')
  lines.push('  completion_date = EXCLUDED.completion_date,')
  lines.push('  visibility = EXCLUDED.visibility;')
  lines.push('')
  lines.push(`-- ${valueLines.length} projects total. ${underConstructionCount} marked as under construction (year_built = NULL).`)

  const out = lines.join('\n')
  const outPath = path.resolve(__dirname, 'portfolio.sql')
  fs.writeFileSync(outPath, out, 'utf8')
  console.log(`✅ Wrote ${outPath} (${out.length.toLocaleString()} chars, ${valueLines.length} properties)`)
}

main()
