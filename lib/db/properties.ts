import type {
  Property,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProperty(row: any): Property {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code ?? undefined,
    priceThb: Number(row.price_thb),
    deal: row.deal as PropertyDeal,
    name: row.name as LocalizedText,
    type: row.type as PropertyType,
    district: row.district as District,
    address: (row.address ?? { ru: '', en: '' }) as LocalizedText,
    areaSqm: Number(row.area_sqm),
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    floor: row.floor ?? undefined,
    totalFloors: row.total_floors ?? undefined,
    yearBuilt: row.year_built ?? 0,
    view: row.view ? (row.view as LocalizedText) : undefined,
    ownership: row.ownership as OwnershipType,
    leaseYearsRemaining: row.lease_years_remaining ?? undefined,
    status: (row.status ?? 'available') as PropertyStatus,
    description: (row.description ?? { ru: '', en: '' }) as LocalizedText,
    amenities: (row.amenities ?? []) as Amenity[],
    tags: (row.tags ?? []) as PropertyTag[],
    coverImage: row.cover_image ?? '',
    gallery: (row.gallery ?? []) as string[],
    city: row.city ? (row.city as City) : undefined,
    developer: row.developer ? (row.developer as LocalizedText) : undefined,
    completionDate: row.completion_date ?? undefined,
    coordinates:
      row.coordinates
        ? (row.coordinates as { lat: number; lng: number })
        : undefined,
    estimatedMonthlyRentThb:
      row.estimated_monthly_rent_thb != null
        ? Number(row.estimated_monthly_rent_thb)
        : undefined,
    estimatedAnnualAppreciationPct:
      row.estimated_annual_appreciation_pct != null
        ? Number(row.estimated_annual_appreciation_pct)
        : undefined,
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
  let query = supabase.from('properties').select('*')

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

  const { data, error } = await query

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
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
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
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[db/properties] getPropertyByCode error:', error.message)
    }
    return null
  }

  return data ? rowToProperty(data) : null
}

export async function getFeaturedProperties(limit = 3): Promise<Property[]> {
  // First try properties explicitly marked featured
  const { data: featured, error: featuredError } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('status', 'available')
    .limit(limit)

  if (!featuredError && featured && featured.length >= limit) {
    return featured.map(rowToProperty)
  }

  // Fall back: available + investor-pick tag
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'available')
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
      .not('slug', 'in', `(${existingSlugs.map((s) => `"${s}"`).join(',')})`)
      .limit(limit - results.length)

    if (filler) {
      results.push(...filler.map(rowToProperty))
    }
  }

  return results.slice(0, limit)
}

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
