import type { Property } from './types'

export interface PropertyFilters {
  type?: Property['type']
  district?: Property['district']
  minAreaSqm?: number
  maxAreaSqm?: number
  minPriceThb?: number
  maxPriceThb?: number
  bedrooms?: number
  ownership?: Property['ownership']
}

export type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'area-desc' | 'newest'

export function sortProperties(items: Property[], key: SortKey): Property[] {
  const arr = [...items]
  switch (key) {
    case 'price-asc':  return arr.sort((a, b) => a.priceThb - b.priceThb)
    case 'price-desc': return arr.sort((a, b) => b.priceThb - a.priceThb)
    case 'area-desc':  return arr.sort((a, b) => b.areaSqm - a.areaSqm)
    case 'newest':     return arr.sort((a, b) => b.yearBuilt - a.yearBuilt)
    case 'recommended':
    default:
      return arr.sort((a, b) => {
        const aScore = (a.status === 'available' ? 2 : 0) + (a.tags.includes('investor-pick') ? 1 : 0)
        const bScore = (b.status === 'available' ? 2 : 0) + (b.tags.includes('investor-pick') ? 1 : 0)
        if (aScore !== bScore) return bScore - aScore
        return b.priceThb - a.priceThb
      })
  }
}
