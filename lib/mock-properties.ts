import type { Property } from './types';

/**
 * Mock properties for ALAB Property catalog.
 * All prices are stored in THB (Thai Baht) and converted on the fly.
 * Replace with real DB queries when backend is ready.
 */
export const mockProperties: Property[] = [
  {
    id: 'p001',
    slug: 'the-reserve-residences-phrom-phong',
    priceThb: 24_500_000,
    deal: 'sale',
    name: {
      ru: 'The Reserve Residences',
      en: 'The Reserve Residences',
    },
    type: 'condo',
    district: 'phrom-phong',
    city: 'bangkok',
    address: {
      ru: 'Сукхумвит 39, Пхром Пхонг, Бангкок',
      en: 'Sukhumvit 39, Phrom Phong, Bangkok',
    },
    areaSqm: 112,
    bedrooms: 2,
    bathrooms: 2,
    floor: 32,
    totalFloors: 38,
    yearBuilt: 2022,
    view: {
      ru: 'Панорамный вид на город',
      en: 'Panoramic city view',
    },
    ownership: 'freehold',
    status: 'available',
    description: {
      ru: 'Резиденция бизнес-класса в одной из самых престижных локаций Бангкока. Просторная двуспальная квартира с панорамными окнами и качественной отделкой от европейских брендов. Закрытая территория, круглосуточная охрана, минута пешком до BTS Phrom Phong.',
      en: 'Business-class residence in one of the most prestigious locations of Bangkok. Spacious 2-bedroom unit with floor-to-ceiling windows and high-end European finishes. Gated community, 24/7 security, one minute walk to BTS Phrom Phong.',
    },
    amenities: ['pool', 'gym', 'sauna', 'parking', 'security', 'concierge', 'rooftop'],
    tags: ['city-view', 'high-floor', 'fully-furnished'],
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
    ],
    developer: {
      ru: 'Sansiri PCL',
      en: 'Sansiri PCL',
    },
    coordinates: { lat: 13.7298, lng: 100.5696 },
    estimatedMonthlyRentThb: 110_000,
    estimatedAnnualAppreciationPct: 5.2,
  },

  {
    id: 'p002',
    slug: 'banyan-tree-sky-villa-sathorn',
    priceThb: 58_000_000,
    deal: 'sale',
    name: {
      ru: 'Banyan Tree Sky Villa',
      en: 'Banyan Tree Sky Villa',
    },
    type: 'penthouse',
    district: 'sathorn',
    city: 'bangkok',
    address: {
      ru: 'Сатхон Роуд, Бангкок',
      en: 'Sathorn Road, Bangkok',
    },
    areaSqm: 198,
    bedrooms: 3,
    bathrooms: 3,
    floor: 54,
    totalFloors: 60,
    yearBuilt: 2021,
    view: {
      ru: 'Вид на реку Чао Прайя и центр города',
      en: 'Chao Phraya river and downtown view',
    },
    ownership: 'freehold',
    status: 'available',
    description: {
      ru: 'Пентхаус под брендом Banyan Tree с приватным бассейном на террасе. Три спальни-сьюта, кабинет, винный погреб. Резидентам доступны услуги отеля Banyan Tree: спа, рестораны, концьерж. Идеальный объект для жизни и долгосрочных инвестиций.',
      en: 'Banyan Tree branded penthouse with a private terrace pool. Three en-suite bedrooms, study, wine cellar. Residents enjoy full Banyan Tree hotel services: spa, restaurants, concierge. An ideal asset for living and long-term investment.',
    },
    amenities: ['pool', 'gym', 'sauna', 'parking', 'security', 'concierge', 'rooftop', 'garden'],
    tags: ['river-view', 'high-floor', 'fully-furnished', 'investor-pick'],
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=85',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85',
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=85',
    ],
    developer: {
      ru: 'Banyan Tree Group',
      en: 'Banyan Tree Group',
    },
    coordinates: { lat: 13.7228, lng: 100.5295 },
    estimatedMonthlyRentThb: 290_000,
    estimatedAnnualAppreciationPct: 5.8,
  },

  {
    id: 'p003',
    slug: 'tela-thonglor-1-bedroom',
    priceThb: 14_800_000,
    deal: 'sale',
    name: {
      ru: 'Tela Thonglor',
      en: 'Tela Thonglor',
    },
    type: 'condo',
    district: 'thonglor',
    city: 'bangkok',
    address: {
      ru: 'Тхонгло Сой 18, Бангкок',
      en: 'Thonglor Soi 18, Bangkok',
    },
    areaSqm: 68,
    bedrooms: 1,
    bathrooms: 1,
    floor: 21,
    totalFloors: 28,
    yearBuilt: 2023,
    view: {
      ru: 'Вид на район Тхонгло',
      en: 'Thonglor district view',
    },
    ownership: 'freehold',
    status: 'available',
    description: {
      ru: 'Однокомнатная квартира в новом доме премиум-класса в самом сердце Тхонгло, района ресторанов и бутиков. Полностью меблирована, готова к заселению. Отличный вариант под аренду: ожидаемая доходность 5-6% годовых.',
      en: 'One-bedroom unit in a brand-new premium development at the heart of Thonglor — Bangkok\'s dining and lifestyle hub. Fully furnished and move-in ready. Strong rental investment, expected yield 5-6% per annum.',
    },
    amenities: ['pool', 'gym', 'parking', 'security', 'co-working', 'pet-friendly'],
    tags: ['new-build', 'fully-furnished', 'investor-pick', 'city-view'],
    coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85',
    ],
    developer: {
      ru: 'Pruksa Real Estate',
      en: 'Pruksa Real Estate',
    },
    completionDate: '2023-Q4',
    coordinates: { lat: 13.7304, lng: 100.5850 },
    estimatedMonthlyRentThb: 75_000,
    estimatedAnnualAppreciationPct: 6.0,
  },

  {
    id: 'p004',
    slug: 'riverside-pool-villa',
    priceThb: 89_000_000,
    deal: 'sale',
    name: {
      ru: 'Riverside Pool Villa',
      en: 'Riverside Pool Villa',
    },
    type: 'villa',
    district: 'riverside',
    city: 'bangkok',
    address: {
      ru: 'Чароэн Накхон Роуд, Бангкок',
      en: 'Charoen Nakhon Road, Bangkok',
    },
    areaSqm: 420,
    bedrooms: 4,
    bathrooms: 5,
    yearBuilt: 2020,
    view: {
      ru: 'Прямой выход к реке Чао Прайя',
      en: 'Direct riverfront access',
    },
    ownership: 'freehold',
    status: 'available',
    description: {
      ru: 'Частная вилла в закрытом поселке на берегу Чао Прайя. Четыре спальни, приватный бассейн с видом на реку, тропический сад. Большая гостиная с двойными потолками, профессиональная кухня, гараж на три машины. Редкий объект для семьи или статусных гостей.',
      en: 'Private villa in a gated riverfront community along the Chao Phraya. Four bedrooms, private pool overlooking the river, tropical garden. Double-height living area, professional kitchen, three-car garage. A rare offering for family living or hosting.',
    },
    amenities: ['pool', 'parking', 'security', 'garden', 'pet-friendly', 'kids-area'],
    tags: ['river-view', 'fully-furnished', 'pool-access'],
    coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=85',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85',
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=85',
      'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1600&q=85',
    ],
    coordinates: { lat: 13.7197, lng: 100.5108 },
    estimatedMonthlyRentThb: 380_000,
    estimatedAnnualAppreciationPct: 6.5,
  },

  {
    id: 'p005',
    slug: 'asok-skyline-studio',
    priceThb: 6_900_000,
    deal: 'sale',
    name: {
      ru: 'Asok Skyline Studio',
      en: 'Asok Skyline Studio',
    },
    type: 'condo',
    district: 'asok',
    city: 'bangkok',
    address: {
      ru: 'Сукхумвит Сой 21, Бангкок',
      en: 'Sukhumvit Soi 21, Bangkok',
    },
    areaSqm: 38,
    bedrooms: 1,
    bathrooms: 1,
    floor: 18,
    totalFloors: 35,
    yearBuilt: 2022,
    view: {
      ru: 'Открытый вид на BTS и центр',
      en: 'Open BTS and downtown view',
    },
    ownership: 'leasehold',
    leaseYearsRemaining: 28,
    status: 'available',
    description: {
      ru: 'Компактная студия в одном из самых популярных районов Бангкока. Прямой выход к BTS Asok и MRT Sukhumvit. Идеально подходит как первый объект для инвестиций или городской апартамент: высокая ликвидность, стабильный рынок аренды.',
      en: 'Compact studio in one of Bangkok\'s most connected neighborhoods. Direct access to BTS Asok and MRT Sukhumvit. Perfect first investment or pied-à-terre — high liquidity and a robust rental market.',
    },
    amenities: ['pool', 'gym', 'security', 'co-working'],
    tags: ['city-view', 'fully-furnished', 'investor-pick'],
    coverImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85',
    ],
    developer: {
      ru: 'Ananda Development',
      en: 'Ananda Development',
    },
    coordinates: { lat: 13.7377, lng: 100.5601 },
    estimatedMonthlyRentThb: 38_000,
    estimatedAnnualAppreciationPct: 4.8,
  },

  {
    id: 'p006',
    slug: 'silom-heritage-townhouse',
    priceThb: 32_000_000,
    deal: 'sale',
    name: {
      ru: 'Silom Heritage Townhouse',
      en: 'Silom Heritage Townhouse',
    },
    type: 'townhouse',
    district: 'silom',
    city: 'bangkok',
    address: {
      ru: 'Силом Сой 9, Бангкок',
      en: 'Silom Soi 9, Bangkok',
    },
    areaSqm: 245,
    bedrooms: 3,
    bathrooms: 4,
    yearBuilt: 2018,
    view: {
      ru: 'Внутренний двор и сад',
      en: 'Inner courtyard and garden',
    },
    ownership: 'freehold',
    status: 'reserved',
    description: {
      ru: 'Современный таунхаус в историческом квартале Силом, рядом с финансовым центром. Три уровня, приватный двор, отдельный кабинет, гараж на две машины. Сочетание тайской архитектуры и современных решений: тиковая отделка, высокие потолки, естественное освещение.',
      en: 'Contemporary townhouse in the historic Silom district, steps from the financial core. Three levels, private courtyard, dedicated study, two-car garage. Thai architectural cues meet modern detailing — teak finishes, high ceilings, natural light throughout.',
    },
    amenities: ['parking', 'security', 'garden', 'pet-friendly'],
    tags: ['city-view', 'investor-pick'],
    coverImage: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=85',
    ],
    coordinates: { lat: 13.7283, lng: 100.5310 },
    estimatedMonthlyRentThb: 145_000,
    estimatedAnnualAppreciationPct: 5.5,
  },
];

// ============================================================
// HELPER QUERIES (replace with DB calls later)
// ============================================================

export function getPropertyBySlug(slug: string): Property | undefined {
  return mockProperties.find((p) => p.slug === slug);
}

export function getFeaturedProperties(limit = 3): Property[] {
  // Featured = available + tagged investor-pick (or first N)
  const investorPicks = mockProperties.filter(
    (p) => p.status === 'available' && p.tags.includes('investor-pick'),
  );
  const filler = mockProperties.filter((p) => p.status === 'available' && !investorPicks.includes(p));
  return [...investorPicks, ...filler].slice(0, limit);
}

export interface PropertyFilters {
  type?: Property['type'];
  district?: Property['district'];
  minAreaSqm?: number;
  maxAreaSqm?: number;
  minPriceThb?: number;
  maxPriceThb?: number;
  bedrooms?: number;
  ownership?: Property['ownership'];
  amenities?: Property['amenities'];
  tags?: Property['tags'];
}

export function filterProperties(filters: PropertyFilters): Property[] {
  return mockProperties.filter((p) => {
    if (filters.type && p.type !== filters.type) return false;
    if (filters.district && p.district !== filters.district) return false;
    if (filters.minAreaSqm !== undefined && p.areaSqm < filters.minAreaSqm) return false;
    if (filters.maxAreaSqm !== undefined && p.areaSqm > filters.maxAreaSqm) return false;
    if (filters.minPriceThb !== undefined && p.priceThb < filters.minPriceThb) return false;
    if (filters.maxPriceThb !== undefined && p.priceThb > filters.maxPriceThb) return false;
    if (filters.bedrooms !== undefined && p.bedrooms < filters.bedrooms) return false;
    if (filters.ownership && p.ownership !== filters.ownership) return false;
    if (filters.amenities?.length && !filters.amenities.every((a) => p.amenities.includes(a))) return false;
    if (filters.tags?.length && !filters.tags.every((t) => p.tags.includes(t))) return false;
    return true;
  });
}

export type SortKey =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'area-desc'
  | 'newest';

export function sortProperties(items: Property[], key: SortKey): Property[] {
  const arr = [...items];
  switch (key) {
    case 'price-asc':
      return arr.sort((a, b) => a.priceThb - b.priceThb);
    case 'price-desc':
      return arr.sort((a, b) => b.priceThb - a.priceThb);
    case 'area-desc':
      return arr.sort((a, b) => b.areaSqm - a.areaSqm);
    case 'newest':
      return arr.sort((a, b) => b.yearBuilt - a.yearBuilt);
    case 'recommended':
    default:
      // available + investor-pick first, then by price desc as a stable tiebreaker
      return arr.sort((a, b) => {
        const aScore = (a.status === 'available' ? 2 : 0) + (a.tags.includes('investor-pick') ? 1 : 0);
        const bScore = (b.status === 'available' ? 2 : 0) + (b.tags.includes('investor-pick') ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        return b.priceThb - a.priceThb;
      });
  }
}

/**
 * Returns properties similar to the given one, ordered by similarity.
 * Used for the "you may also like" block on the property detail page.
 */
export function getRelatedProperties(currentSlug: string, limit = 3): Property[] {
  const current = mockProperties.find((p) => p.slug === currentSlug);
  if (!current) return [];

  const others = mockProperties.filter((p) => p.slug !== currentSlug && p.status === 'available');

  // Simple similarity: same district +3, same type +2, similar price (within 50%) +1
  const scored = others.map((p) => {
    let score = 0;
    if (p.district === current.district) score += 3;
    if (p.type === current.type) score += 2;
    const priceDelta = Math.abs(p.priceThb - current.priceThb) / current.priceThb;
    if (priceDelta <= 0.5) score += 1;
    return { p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}
