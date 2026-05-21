// ============================================================
// CORE TYPES
// ============================================================

export type Locale = 'ru' | 'en';
export type Currency = 'THB' | 'USD' | 'EUR' | 'RUB' | 'USDT';
export type City = 'bangkok' | 'pattaya';

// ============================================================
// PROPERTY TYPES
// ============================================================

export type PropertyType = 'condo' | 'villa' | 'townhouse' | 'land' | 'penthouse' | 'house' | 'commercial' | 'office' | 'retail' | 'hotel';
export type PropertyDeal = 'sale' | 'rent';
export type OwnershipType = 'freehold' | 'leasehold';
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'building' | 'soon';

export type District =
  | 'sukhumvit'
  | 'silom'
  | 'sathorn'
  | 'thonglor'
  | 'phrom-phong'
  | 'asok'
  | 'riverside'
  | 'ari';

export type Amenity =
  | 'pool'
  | 'gym'
  | 'sauna'
  | 'parking'
  | 'security'
  | 'concierge'
  | 'co-working'
  | 'garden'
  | 'rooftop'
  | 'kids-area'
  | 'pet-friendly';

export type PropertyTag =
  | 'sea-view'
  | 'city-view'
  | 'river-view'
  | 'new-build'
  | 'fully-furnished'
  | 'pool-access'
  | 'high-floor'
  | 'investor-pick';

// localized text - same value in both languages where it makes sense
export interface LocalizedText {
  ru: string;
  en: string;
}

export interface Property {
  id: string;
  slug: string;
  // уникальный 4-символьный код объекта (для поиска и менеджеров)
  code?: string;
  // pricing - all stored in THB, converted on the fly
  priceThb: number;
  deal: PropertyDeal;
  // basic
  name: LocalizedText;
  type: PropertyType;
  district: District;
  address: LocalizedText;
  // specs
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt: number;
  view?: LocalizedText;
  // ownership (важно для Таиланда)
  ownership: OwnershipType;
  leaseYearsRemaining?: number; // только для leasehold
  // status
  status: PropertyStatus;
  // content
  description: LocalizedText;
  amenities: Amenity[];
  tags: PropertyTag[];
  // media
  coverImage: string;
  gallery: string[];
  // city
  city?: City;
  // sales
  developer?: LocalizedText;
  completionDate?: string; // off-plan projects
  // Map
  coordinates?: { lat: number; lng: number };
  // ROI inputs (used as defaults in the calculator on the property page)
  estimatedMonthlyRentThb?: number;     // expected gross monthly rental income
  estimatedAnnualAppreciationPct?: number; // e.g. 4.5 means 4.5% / year
}

// ============================================================
// LEGAL ARTICLE TYPES
// ============================================================

export type ArticleCategory =
  | 'buying-guide'
  | 'tax'
  | 'visa'
  | 'company-news'
  | 'market-analysis'
  | 'case-study';

export interface Article {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  category: ArticleCategory;
  publishedAt: string; // ISO date
  readingTimeMin: number;
  coverImage: string;
  author: LocalizedText;
  // For listing only - full content would be MDX in production
  contentPreview: LocalizedText;
}
