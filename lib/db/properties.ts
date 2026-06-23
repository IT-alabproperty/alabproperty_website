import type {
  Property,
  PropertyUnit,
  PropertyUnitStatus,
  PropertyType,
  PropertyDeal,
  OwnershipType,
  PropertyStatus,
  District,
  City,
  Amenity,
  PropertyTag,
  LocalizedText,
} from '../types'
import { unstable_cache } from 'next/cache'
import { supabase } from '../supabase'

export interface PropertyFilters {
  type?: PropertyType
  district?: District
  minAreaSqm?: number
  maxAreaSqm?: number
  minPriceThb?: number
  maxPriceThb?: number
  bedrooms?: number
  ownership?: OwnershipType
  amenities?: Amenity[]
  tags?: PropertyTag[]
}

export type SortKey =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'area-desc'
  | 'newest'

function prettify(slug: string): string {
  return String(slug ?? '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ensureLocalized(value: any, fallback: string): LocalizedText {
  if (value && typeof value === 'object') {
    const ru = typeof value.ru === 'string' ? value.ru : (typeof value.en === 'string' ? value.en : fallback)
    const en = typeof value.en === 'string' ? value.en : (typeof value.ru === 'string' ? value.ru : fallback)
    return { ru, en } as LocalizedText
  }
  return { ru: fallback, en: fallback } as LocalizedText
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProperty(row: any): Property {
  const slug = String(row.slug ?? '')
  const fallbackName = prettify(slug) || 'Untitled'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coords: any = row.coordinates
  const validCoords =
    coords && typeof coords === 'object' && typeof coords.lat === 'number' && typeof coords.lng === 'number'
      ? { lat: coords.lat, lng: coords.lng }
      : undefined
  return {
    id: row.id,
    slug,
    code: row.code ?? undefined,
    priceThb: Number(row.price_thb) || 0,
    deal: (row.deal ?? 'sale') as PropertyDeal,
    name: ensureLocalized(row.name, fallbackName),
    type: row.type as PropertyType,
    district: row.district as District,
    address: ensureLocalized(row.address, ''),
    areaSqm: Number(row.area_sqm) || 0,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    floor: row.floor ?? undefined,
    totalFloors: row.total_floors ?? undefined,
    yearBuilt: row.year_built ?? 0,
    view: row.view ? ensureLocalized(row.view, '') : undefined,
    ownership: (row.ownership ?? 'freehold') as OwnershipType,
    leaseYearsRemaining: row.lease_years_remaining ?? undefined,
    status: (row.status ?? 'available') as PropertyStatus,
    description: ensureLocalized(row.description, ''),
    amenities: Array.isArray(row.amenities) ? (row.amenities as Amenity[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as PropertyTag[]) : [],
    coverImage: row.cover_image ?? '',
    coverFocus: row.cover_focus ?? undefined,
    coverZoom: row.cover_zoom != null ? Number(row.cover_zoom) : undefined,
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
    city: row.city ? (row.city as City) : undefined,
    developer: row.developer ? ensureLocalized(row.developer, '') : undefined,
    completionDate: row.completion_date ?? undefined,
    coordinates: validCoords,
    estimatedMonthlyRentThb:
      row.estimated_monthly_rent_thb != null
        ? Number(row.estimated_monthly_rent_thb)
        : undefined,
    estimatedAnnualAppreciationPct:
      row.estimated_annual_appreciation_pct != null
        ? Number(row.estimated_annual_appreciation_pct)
        : undefined,
    isComplex: !!row.is_complex,
    totalUnits: row.total_units != null ? Number(row.total_units) : undefined,
    floorplanImage: row.floorplan_image ?? undefined,
  }
}

export function sortProperties(items: Property[], key: SortKey): Property[] {
  const arr = [...items]
  switch (key) {
    case 'price-asc':
      return arr.sort((a, b) => a.priceThb - b.priceThb)
    case 'price-desc':
      return arr.sort((a, b) => b.priceThb - a.priceThb)
    case 'area-desc':
      return arr.sort((a, b) => b.areaSqm - a.areaSqm)
    case 'newest':
      return arr.sort((a, b) => b.yearBuilt - a.yearBuilt)
    case 'recommended':
    default:
      return arr.sort((a, b) => {
        const aScore =
          (a.status === 'available' ? 2 : 0) +
          (a.tags.includes('investor-pick') ? 1 : 0)
        const bScore =
          (b.status === 'available' ? 2 : 0) +
          (b.tags.includes('investor-pick') ? 1 : 0)
        if (aScore !== bScore) return bScore - aScore
        return b.priceThb - a.priceThb
      })
  }
}

export async function getAllProperties(
  filters?: PropertyFilters,
  city?: string,
  sort?: SortKey,
): Promise<Property[]> {
  // Only published rows reach the public site. Hidden/draft are admin-only.
  // Note: relies on the visibility column from migration 011. Before it's
  // applied, the .eq filter is a no-op against missing column would fail —
  // see retry logic in the catch below.
  let query = supabase.from('properties').select('*').eq('visibility', 'published')

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.district) {
    query = query.eq('district', filters.district)
  }
  if (filters?.ownership) {
    query = query.eq('ownership', filters.ownership)
  }
  if (filters?.minPriceThb !== undefined) {
    query = query.gte('price_thb', filters.minPriceThb)
  }
  if (filters?.maxPriceThb !== undefined) {
    query = query.lte('price_thb', filters.maxPriceThb)
  }
  if (filters?.minAreaSqm !== undefined) {
    query = query.gte('area_sqm', filters.minAreaSqm)
  }
  if (filters?.maxAreaSqm !== undefined) {
    query = query.lte('area_sqm', filters.maxAreaSqm)
  }
  if (filters?.bedrooms !== undefined) {
    query = query.gte('bedrooms', filters.bedrooms)
  }
  if (filters?.amenities?.length) {
    query = query.contains('amenities', filters.amenities)
  }
  if (filters?.tags?.length) {
    query = query.contains('tags', filters.tags)
  }
  if (city) {
    query = query.eq('city', city)
  }

  let { data, error } = await query

  // Pre-migration fallback: if visibility column doesn't exist, retry without it.
  if (error && error.code === '42703') {
    const retry = await supabase.from('properties').select('*')
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[db/properties] getAllProperties error:', error.message, error.code, error.details, error.hint)
    return []
  }

  const properties = (data ?? []).map(rowToProperty)
  return sort ? sortProperties(properties, sort) : properties
}

export async function filterProperties(
  filters: PropertyFilters,
  city?: string,
): Promise<Property[]> {
  return getAllProperties(filters, city)
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  // Returning null for non-published rows means the page renders notFound()
  // → proper 404 (not a soft "hidden" page that Google could still index).
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .eq('visibility', 'published')
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[db/properties] getPropertyBySlug error:', error)
    }
    return null
  }

  return data ? rowToProperty(data) : null
}

export async function getPropertyByCode(code: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('visibility', 'published')
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[db/properties] getPropertyByCode error:', error.message)
    }
    return null
  }

  return data ? rowToProperty(data) : null
}

async function fetchFeaturedPropertiesUncached(limit: number): Promise<Property[]> {
  // First try properties explicitly marked featured
  const { data: featured, error: featuredError } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('status', 'available')
    .eq('visibility', 'published')
    .limit(limit)

  if (!featuredError && featured && featured.length >= limit) {
    return featured.map(rowToProperty)
  }

  // Fall back: available + investor-pick tag
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .eq('visibility', 'published')
    .contains('tags', ['investor-pick'])
    .limit(limit)

  if (error) {
    console.error('[db/properties] getFeaturedProperties error:', error)
    return []
  }

  const results = (data ?? []).map(rowToProperty)

  // Fill up to limit if not enough investor-pick properties
  if (results.length < limit) {
    const existingSlugs = results.map((p) => p.slug)
    const { data: filler } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'available')
      .eq('visibility', 'published')
      .not('slug', 'in', `(${existingSlugs.map((s) => `"${s}"`).join(',')})`)
      .limit(limit - results.length)

    if (filler) {
      results.push(...filler.map(rowToProperty))
    }
  }

  return results.slice(0, limit)
}

// Cached 5 min — featured changes rarely, and this lives on the home page
// which gets the most traffic. Tag-based revalidation when properties update
// can be added via revalidateTag('properties') from the admin save handler.
export const getFeaturedProperties = unstable_cache(
  (limit: number = 3) => fetchFeaturedPropertiesUncached(limit),
  ['properties:featured'],
  { revalidate: 300, tags: ['properties', 'properties:featured'] },
)

export async function getRelatedProperties(
  currentSlug: string,
  limit = 3,
): Promise<Property[]> {
  const current = await getPropertyBySlug(currentSlug)
  if (!current) return []

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .eq('visibility', 'published')
    .neq('slug', currentSlug)

  if (error) {
    console.error('[db/properties] getRelatedProperties error:', error)
    return []
  }

  const others = (data ?? []).map(rowToProperty)

  const scored = others.map((p) => {
    let score = 0
    if (p.district === current.district) score += 3
    if (p.type === current.type) score += 2
    const priceDelta = Math.abs(p.priceThb - current.priceThb) / current.priceThb
    if (priceDelta <= 0.5) score += 1
    return { p, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUnit(row: any): PropertyUnit {
  return {
    id: row.id,
    propertyId: row.property_id,
    unitType: row.unit_type ?? '',
    name: ensureLocalized(row.name, row.unit_type ?? ''),
    description: row.description ? ensureLocalized(row.description, '') : undefined,
    priceThb: row.price_thb != null ? Number(row.price_thb) : undefined,
    areaSqm: row.area_sqm != null ? Number(row.area_sqm) : undefined,
    bedrooms: row.bedrooms ?? 1,
    bathrooms: row.bathrooms ?? 1,
    availableUnits: row.available_units ?? 0,
    status: (row.status ?? 'available') as PropertyUnitStatus,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    floorRange: row.floor_range ?? undefined,
    sortOrder: row.sort_order ?? 0,
  }
}

export async function getPropertyUnits(propertyId: string): Promise<PropertyUnit[]> {
  const { data, error } = await supabase
    .from('property_units')
    .select('*')
    .eq('property_id', propertyId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[db/properties] getPropertyUnits error:', error)
    return []
  }

  return (data ?? []).map(rowToUnit)
}
