import type { Metadata } from 'next';
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
// Question wording is deliberately matched to Google's "People Also Ask"
// blocks for the queries we target — same phrasing increases the chance
// Google pulls our answer into PAA accordions in SERP.
// Answers stay under ~300 chars (often truncated in SERP).
const FAQ_RU = [
  {
    q: 'Может ли иностранец купить недвижимость в Таиланде?',
    a: 'Да. Иностранцы могут владеть квартирой в кондоминиуме freehold (до 49% площади здания на иностранных собственниках по Condominium Act). Виллы и земля — через долгосрочную аренду leasehold (30 лет с продлением) или через тайскую компанию.',
  },
  {
    q: 'Можно ли купить квартиру в Таиланде без гражданства?',
    a: 'Да, гражданство Таиланда для покупки не требуется. Иностранец без ВНЖ может оформить квартиру в кондоминиуме на своё имя freehold в рамках 49% иностранной квоты здания. Достаточно загранпаспорта и перевода средств через тайский банк.',
  },
  {
    q: 'Сколько стоит купить недвижимость в Таиланде?',
    a: 'Студия в кондо в Паттайе или Пхукете — от 2 млн THB (~$57k). Квартира в Бангкоке — от 4–6 млн THB. Премиальные виллы и пентхаусы — от 20 млн THB и выше. ALAB подбирает объекты под бюджет и цели инвестора.',
  },
  {
    q: 'Сколько стоит юрист при покупке недвижимости в Таиланде?',
    a: 'Стандартное сопровождение сделки с due diligence, контрактом и регистрацией в Land Department — от 50 000 до 150 000 THB в зависимости от сложности. ALAB-клиенты получают сопровождение от A.L.A.B Consultant как часть пакета.',
  },
  {
    q: 'Что такое freehold и leasehold в Таиланде?',
    a: 'Freehold — полная собственность без срока (доступна иностранцам только на квартиры в кондоминиумах в рамках 49% квоты). Leasehold — долгосрочная аренда 30 лет с правом продления, используется иностранцами для вилл и земли.',
  },
  {
    q: 'Каков порядок сделки от выбора до получения ключей?',
    a: 'Подбор объекта → due diligence (титул, обременения, репутация застройщика) → подписание договора → перевод средств через тайский банк → регистрация в Land Department → передача ключей. Срок 4–8 недель.',
  },
  {
    q: 'Какие налоги и комиссии при покупке недвижимости?',
    a: 'Transfer fee (2% от оценки), specific business tax (3.3% если продавец владел <5 лет), withholding tax, гербовый сбор. Итого обычно 4–6% от цены. Распределение между сторонами оговаривается в договоре.',
  },
  {
    q: 'Можно ли оплатить недвижимость криптовалютой?',
    a: 'Да. ALAB работает с USDT (ERC-20) как стандартной валютой расчёта. Для крупных сумм и других токенов — индивидуальный OTC. Юристы оформляют поступление в полном соответствии с тайским законодательством для регистрации сделки.',
  },
];

const FAQ_EN = [
  {
    q: 'Is it possible for a foreigner to buy property in Thailand?',
    a: 'Yes. Foreigners can hold condominium units in full freehold (subject to the 49% foreign-quota per building under the Condominium Act). Villas and land are typically acquired via long-term leasehold (30 years renewable) or through a Thai company.',
  },
  {
    q: 'Do I need a lawyer to buy a condo in Thailand?',
    a: 'Strongly recommended. A lawyer verifies the title deed, checks encumbrances and developer credentials, drafts a Sale & Purchase Agreement that protects you, handles funds remittance compliance, and represents you at the Land Department. ALAB pairs every sale with in-house legal counsel.',
  },
  {
    q: 'How much does property cost in Thailand?',
    a: 'Studio condos in Pattaya or Phuket start from 2M THB (~$57k). Bangkok apartments start from 4–6M THB. Premium villas and penthouses start from 20M THB and up. ALAB curates listings to match buyer budget and investment goals.',
  },
  {
    q: 'How much does a property lawyer cost in Thailand?',
    a: 'Standard transaction support — due diligence, contract drafting, Land Department registration — runs 50,000–150,000 THB depending on complexity. ALAB clients receive legal support from A.L.A.B Consultant as part of the service.',
  },
  {
    q: 'What is the difference between freehold and leasehold in Thailand?',
    a: 'Freehold is full ownership with no time limit (available to foreigners only for condominium units within the 49% quota). Leasehold is a long-term lease — typically 30 years with renewal — the standard route foreigners use for villas and land.',
  },
  {
    q: 'What is the transaction process from viewing to handover?',
    a: 'Property selection → due diligence (title, encumbrances, developer track record) → Sale & Purchase Agreement → funds transferred via a Thai bank → registration at the Land Department → handover. Typical timeline: 4–8 weeks.',
  },
  {
    q: 'What taxes and fees apply when buying property in Thailand?',
    a: 'Transfer fee (2% of appraised value), specific business tax (3.3% if seller held < 5 years), withholding tax, stamp duty. Combined usually 4–6% of the price. Split between buyer and seller is negotiated in the contract.',
  },
  {
    q: 'Can I pay for property in cryptocurrency?',
    a: 'Yes. ALAB settles in USDT (ERC-20) as standard. For larger sums or alternative tokens — OTC arrangements case-by-case. Our legal team formalises the inflow in full compliance with Thai law for Land Department registration.',
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
      {/* Plain <script> — next/script with default strategy packs inline JSON
          into the RSC payload instead of rendering an actual tag in HTML, so
          Googlebot's Rich Results Test reports "no items detected". A vanilla
          <script type="application/ld+json"> in a server component renders
          directly into the initial HTML, which is what crawlers need. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
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

