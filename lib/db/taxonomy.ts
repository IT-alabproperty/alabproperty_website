import { supabase } from '../supabase'

export interface TaxonomyRow {
  slug: string
  name: { ru: string; en: string }
}

export interface DistrictRow extends TaxonomyRow {
  city_slug: string | null
}

export async function getCities(): Promise<TaxonomyRow[]> {
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

export async function getPropertyTypes(): Promise<TaxonomyRow[]> {
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

export async function getDistricts(): Promise<DistrictRow[]> {
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

export async function getAmenities(): Promise<TaxonomyRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_amenities')
    .select('slug, name')
    .order('slug', { ascending: true })
  if (error) {
    console.error('[db/taxonomy] getAmenities error:', error.message)
    return []
  }
  return (data ?? []) as TaxonomyRow[]
}

export async function getTags(): Promise<TaxonomyRow[]> {
  const { data, error } = await supabase
    .from('taxonomy_tags')
    .select('slug, name')
    .order('slug', { ascending: true })
  if (error) {
    console.error('[db/taxonomy] getTags error:', error.message)
    return []
  }
  return (data ?? []) as TaxonomyRow[]
}
