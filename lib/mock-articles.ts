import type { Article } from './types';

/**
 * Mock articles for the Legal section.
 * In production these will be MDX files or come from a CMS.
 */
export const mockArticles: Article[] = [
  {
    id: 'a001',
    slug: 'foreign-ownership-thailand-2026',
    title: {
      ru: 'Что иностранец может купить в Таиланде в 2026 году',
      en: 'What Foreigners Can Buy in Thailand in 2026',
    },
    excerpt: {
      ru: 'Полный разбор форм собственности: freehold для квартир, leasehold для земли, и стратегии для виллы.',
      en: 'A complete breakdown of ownership types: freehold for condos, leasehold for land, and strategies for villa purchases.',
    },
    category: 'buying-guide',
    publishedAt: '2026-03-15',
    readingTimeMin: 8,
    coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=85',
    author: {
      ru: 'Алексей Барсуков, юрист',
      en: 'Alexey Barsukov, Counsel',
    },
    contentPreview: {
      ru: 'Согласно Закону о кондоминиумах, иностранец имеет право приобретать в полную собственность квартиры в кондоминиумах при условии, что доля иностранцев в проекте не превышает 49%. Земля приобретается через долгосрочную аренду на 30 лет с возможностью продления.',
      en: 'Under the Condominium Act, foreigners may acquire freehold ownership of condominium units provided that foreign ownership in the project does not exceed 49%. Land is typically acquired through 30-year leasehold structures with renewal provisions.',
    },
  },

  {
    id: 'a002',
    slug: 'due-diligence-checklist',
    title: {
      ru: 'Due Diligence: 12 пунктов проверки перед покупкой',
      en: 'Due Diligence: 12 Checks Before You Buy',
    },
    excerpt: {
      ru: 'Чек-лист, по которому юристы ALAB проверяют каждый объект. От проверки титула до репутации застройщика.',
      en: 'The checklist ALAB lawyers run on every property. From title verification to developer reputation.',
    },
    category: 'buying-guide',
    publishedAt: '2026-02-28',
    readingTimeMin: 12,
    coverImage: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85',
    author: {
      ru: 'Анна Петрова, старший юрист',
      en: 'Anna Petrova, Senior Counsel',
    },
    contentPreview: {
      ru: 'Каждая сделка ALAB Property проходит обязательную процедуру due diligence. Мы проверяем юридическую чистоту титула в Земельном департаменте, наличие обременений и арестов, репутацию застройщика и историю проекта, разрешения на строительство, фактическое состояние объекта.',
      en: 'Every ALAB Property transaction undergoes mandatory due diligence. We verify title at the Land Department, check for encumbrances and seizures, review the developer\'s track record and project history, building permits, and the physical state of the property.',
    },
  },

  {
    id: 'a003',
    slug: 'tax-on-property-thailand',
    title: {
      ru: 'Налоги на недвижимость в Таиланде для иностранцев',
      en: 'Property Taxes in Thailand for Foreigners',
    },
    excerpt: {
      ru: 'Налог при покупке, ежегодные платежи и налогообложение арендного дохода. Что нужно знать инвестору.',
      en: 'Transfer tax, annual property tax and rental income taxation. What every investor should know.',
    },
    category: 'tax',
    publishedAt: '2026-02-10',
    readingTimeMin: 6,
    coverImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
    author: {
      ru: 'Дмитрий Соколов, налоговый консультант',
      en: 'Dmitry Sokolov, Tax Advisor',
    },
    contentPreview: {
      ru: 'При покупке недвижимости в Таиланде покупатель платит государственный сбор за регистрацию права собственности — 2% от оценочной стоимости объекта по данным Земельного департамента. Этот сбор может быть разделён между покупателем и продавцом по договорённости.',
      en: 'On purchase, the buyer pays a transfer fee of 2% of the property\'s assessed value as recorded by the Land Department. This fee may be split between buyer and seller by agreement.',
    },
  },

  {
    id: 'a004',
    slug: 'thailand-elite-visa-property',
    title: {
      ru: 'Виза Thailand Elite через инвестиции в недвижимость',
      en: 'Thailand Elite Visa Through Property Investment',
    },
    excerpt: {
      ru: 'Программа долгосрочных виз для инвесторов. Условия, сроки, какую недвижимость учитывают.',
      en: 'Long-term visa program for investors. Terms, timelines, and which properties qualify.',
    },
    category: 'visa',
    publishedAt: '2026-01-22',
    readingTimeMin: 7,
    coverImage: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=85',
    author: {
      ru: 'Алексей Барсуков, юрист',
      en: 'Alexey Barsukov, Counsel',
    },
    contentPreview: {
      ru: 'Программа Thailand Elite — это система долгосрочных виз для состоятельных иностранцев. С 2023 года программа была реструктурирована: теперь действуют четыре уровня членства сроком от 5 до 20 лет, с разным набором привилегий.',
      en: 'Thailand Elite is a long-term visa program for high-net-worth foreigners. The program was restructured in 2023: there are now four membership tiers ranging from 5 to 20 years, each with a distinct set of privileges.',
    },
  },

  {
    id: 'a005',
    slug: 'bangkok-market-q1-2026',
    title: {
      ru: 'Рынок Бангкока: Q1 2026 — где растут цены',
      en: 'Bangkok Market: Q1 2026 — Where Prices Are Rising',
    },
    excerpt: {
      ru: 'Аналитика по районам: Тхонгло, Сатхон, Riverside. Какие сегменты показали лучшую динамику.',
      en: 'District-level analysis: Thonglor, Sathorn, Riverside. Which segments outperformed.',
    },
    category: 'market-analysis',
    publishedAt: '2026-04-05',
    readingTimeMin: 10,
    coverImage: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85',
    author: {
      ru: 'Команда аналитики ALAB',
      en: 'ALAB Research Team',
    },
    contentPreview: {
      ru: 'По итогам первого квартала 2026 года средняя цена квадратного метра в премиальном сегменте Бангкока выросла на 4.2%. Наибольший рост показал район Тхонгло благодаря открытию двух новых отелей-резиденций под международными брендами.',
      en: 'In Q1 2026, average price per square meter in Bangkok\'s premium segment grew 4.2%. Thonglor led the rise, driven by the opening of two new internationally branded hotel-residences in the district.',
    },
  },

  {
    id: 'a006',
    slug: 'case-study-50m-villa-acquisition',
    title: {
      ru: 'Кейс: покупка виллы за 50M батов под видом долгосрочной аренды',
      en: 'Case Study: Acquiring a 50M THB Villa Through Long-Term Lease',
    },
    excerpt: {
      ru: 'Реальная сделка: как клиент из России получил права на виллу с земельным участком в обход закона об иностранной собственности.',
      en: 'A real transaction: how a Russian client secured rights to a land-and-villa property within Thailand\'s foreign ownership framework.',
    },
    category: 'case-study',
    publishedAt: '2026-01-08',
    readingTimeMin: 9,
    coverImage: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1600&q=85',
    author: {
      ru: 'Анна Петрова, старший юрист',
      en: 'Anna Petrova, Senior Counsel',
    },
    contentPreview: {
      ru: 'Клиент обратился с запросом на приобретение виллы стоимостью 50 миллионов батов в районе Riverside. Поскольку прямое владение землёй для иностранцев в Таиланде запрещено, мы структурировали сделку через 30-летний договор аренды с двумя правами продления, что обеспечивает 90 лет защищённого пользования.',
      en: 'The client sought to acquire a 50 million THB villa in the Riverside district. Since direct land ownership is restricted for foreigners in Thailand, we structured the transaction through a 30-year lease with two renewal rights, providing 90 years of protected use.',
    },
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return mockArticles.find((a) => a.slug === slug);
}

export function getRecentArticles(limit = 3): Article[] {
  return [...mockArticles]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

export function getArticlesByCategory(category: Article['category']): Article[] {
  return mockArticles.filter((a) => a.category === category);
}
