import type { Metadata } from 'next';
import Script from 'next/script';
import { getLocale, getTranslations } from 'next-intl/server';
import { HeroSlideshow } from '@/components/hero-slideshow';
import { SearchSection } from '@/components/sections/search-section';
import { GuaranteeSection } from '@/components/sections/guarantee-section';
import { FeaturedPropertiesSection } from '@/components/sections/featured-properties-section';
import { ValuesSection } from '@/components/sections/values-section';
import { FinalCtaSection } from '@/components/sections/final-cta-section';
import { SectionDivider } from '@/components/ui/section-divider';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import type { Locale } from '@/lib/types';

// FAQ source-of-truth. Declared up-front (before any component reference) so
// the constants are initialized before RSC starts evaluating the page.
// Keep ≤ 6 questions per locale — Google's rich result only surfaces the
// first few. Answers stay under ~300 chars (often truncated in SERP).
const FAQ_RU = [
  {
    q: 'Может ли иностранец купить недвижимость в Таиланде?',
    a: 'Да. Иностранцы могут владеть кондо freehold (до 49% площади здания на иностранных собственниках). Виллы и земля — через долгосрочную аренду leasehold (30 лет с продлением) или через тайскую компанию.',
  },
  {
    q: 'Каков порядок сделки от выбора до получения ключей?',
    a: 'Подбор объекта → due diligence (проверка титула, обременений, репутации застройщика) → подписание договора → перевод средств через тайский банк → регистрация в Land Department → передача ключей. Срок 4–8 недель.',
  },
  {
    q: 'Какие налоги и комиссии при покупке?',
    a: 'Transfer fee (2% от оценки), specific business tax (3.3% если продавец владел <5 лет), withholding tax, гербовый сбор. Итого обычно 4–6% от цены. Распределение между сторонами оговаривается в договоре.',
  },
  {
    q: 'Можно ли оплатить криптовалютой?',
    a: 'Да. ALAB работает с USDT-TRC20 и другими стейблкоинами. Юристы помогут с конвертацией через тайские OTC-каналы и легализацией поступления для регистрации в Land Department.',
  },
  {
    q: 'Что покрывает юридическое сопровождение ALAB?',
    a: 'Полный цикл: due diligence, проверка титула и обременений, подготовка договора, эскроу, валютные операции, представительство в Land Department, регистрация прав собственности. Сделка ведётся на русском и английском.',
  },
  {
    q: 'Можно ли сдавать купленную недвижимость в аренду?',
    a: 'Да, и краткосрочно (Airbnb) и долгосрочно. Краткосрочная аренда требует лицензии hotel licence в большинстве зданий — мы помогаем оформить или подбираем объекты где это уже разрешено.',
  },
];

const FAQ_EN = [
  {
    q: 'Can a foreigner buy property in Thailand?',
    a: 'Yes. Foreigners can hold a condominium in full freehold (subject to the 49% foreign-quota per building). Villas and land are typically acquired via long-term leasehold (30 years renewable) or through a Thai company.',
  },
  {
    q: 'What is the transaction process from viewing to handover?',
    a: 'Property selection → due diligence (title, encumbrances, developer track record) → sale & purchase agreement → funds transferred via a Thai bank → registration at the Land Department → handover. Typical timeline: 4–8 weeks.',
  },
  {
    q: 'What taxes and fees apply on purchase?',
    a: 'Transfer fee (2% of appraised value), specific business tax (3.3% if seller held < 5 years), withholding tax, stamp duty. Combined usually 4–6% of the price. Split between buyer and seller is negotiated in the contract.',
  },
  {
    q: 'Can I pay in cryptocurrency?',
    a: 'Yes. ALAB works with USDT-TRC20 and other stablecoins. Our legal team handles conversion via Thai OTC channels and formalises the inflow for Land Department registration.',
  },
  {
    q: 'What does ALAB legal support cover?',
    a: 'Full transaction lifecycle: due diligence, title check, contract drafting, escrow, FX operations, Land Department representation, ownership registration. Everything in English and Russian.',
  },
  {
    q: 'Can I rent out the property after purchase?',
    a: 'Yes — short-term (Airbnb-style) and long-term. Short-term rentals usually require a hotel licence; we either arrange one or recommend buildings where it is already permitted.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('defaultTitle'),
    description: t('pages.home.description'),
    path: '/',
  });
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });

  // WebSite JSON-LD with a SearchAction so search engines surface a sitelinks
  // search box. The query is appended as ?q= on /properties.
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('siteName'),
    url: SITE_URL,
    inLanguage: locale === 'ru' ? 'ru-RU' : 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/properties?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // FAQPage JSON-LD — recurring questions Russian + Western buyers ask before
  // contacting an agency. Google may show these as expandable accordions
  // directly in search results, which lifts CTR significantly.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (locale === 'ru' ? FAQ_RU : FAQ_EN).map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  };

  return (
    <main>
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <HeroSlideshow />
      <SearchSection />
      <GuaranteeSection />
      <FeaturedPropertiesSection />
      <div className="bg-paper">
        <SectionDivider className="py-4" />
      </div>
      <ValuesSection />
      <FinalCtaSection />
    </main>
  );
}

