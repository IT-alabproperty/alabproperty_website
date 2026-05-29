import { unstable_cache } from 'next/cache'
import { supabase } from '../supabase'

export interface TaxonomyRow {
  slug: string
  name: { ru: string; en: string }
}

export interface DistrictRow extends TaxonomyRow {
  city_slug: string | null
}

// Taxonomies rarely change (admin edits maybe a few times a week).
// Cache for 1 hour in the lambda + at the CDN, dedupe within a single request.
// Tag-based revalidation lets admin manually purge via `revalidate('taxonomies')`
// if/when we wire that up.
const CACHE_TTL_S = 3600

async function fetchCitiesUncached(): Promise<TaxonomyRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_cities')
    .select('slug, name')
    .order('slug', { ascending: true })
  if (error) {
    console.error('[db/taxonomy] getCities error:', error.message)
    return []
  }
  return (data ?? []) as TaxonomyRow[]
}

async function fetchPropertyTypesUncached(): Promise<TaxonomyRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_property_types')
    .select('slug, name')
    .order('slug', { ascending: true })
  if (error) {
    console.error('[db/taxonomy] getPropertyTypes error:', error.message)
    return []
  }
  return (data ?? []) as TaxonomyRow[]
}

async function fetchDistrictsUncached(): Promise<DistrictRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_districts')
    .select('slug, name, city_slug')
    .order('slug', { ascending: true })
  if (error) {
    console.error('[db/taxonomy] getDistricts error:', error.message)
    return []
  }
  return (data ?? []) as DistrictRow[]
}

async function fetchAmenitiesUncached(): Promise<TaxonomyRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_amenities')
    .select('slug, name')
    .order('slug', { ascending: true })
  if (error) {
    // Pre-migration: amenities table doesn't exist yet → empty list is fine,
    // PropertyForm has hardcoded base options anyway.
    if (error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('[db/taxonomy] getAmenities error:', error.message)
    }
    return []
  }
  return (data ?? []) as TaxonomyRow[]
}

async function fetchTagsUncached(): Promise<TaxonomyRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_tags')
    .select('slug, name')
    .order('slug', { ascending: true })
  if (error) {
    if (error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error('[db/taxonomy] getTags error:', error.message)
    }
    return []
  }
  return (data ?? []) as TaxonomyRow[]
}

export const getCities = unstable_cache(fetchCitiesUncached, ['taxonomy:cities'], {
  revalidate: CACHE_TTL_S,
  tags: ['taxonomies', 'taxonomy:cities'],
})

export const getPropertyTypes = unstable_cache(fetchPropertyTypesUncached, ['taxonomy:types'], {
  revalidate: CACHE_TTL_S,
  tags: ['taxonomies', 'taxonomy:types'],
})

export const getDistricts = unstable_cache(fetchDistrictsUncached, ['taxonomy:districts'], {
  revalidate: CACHE_TTL_S,
  tags: ['taxonomies', 'taxonomy:districts'],
})

export const getAmenities = unstable_cache(fetchAmenitiesUncached, ['taxonomy:amenities'], {
  revalidate: CACHE_TTL_S,
  tags: ['taxonomies', 'taxonomy:amenities'],
})

export const getTags = unstable_cache(fetchTagsUncached, ['taxonomy:tags'], {
  revalidate: CACHE_TTL_S,
  tags: ['taxonomies', 'taxonomy:tags'],
})
