import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/eyebrow';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.business.title'),
    description: t('pages.business.description'),
    path: '/business',
  });
}

interface Card {
  title: { ru: string; en: string };
  body: { ru: string; en: string };
}

const HELP_TAGS = [
  { ru: 'Иностранные инвесторы', en: 'Foreign investors' },
  { ru: 'Частные покупатели', en: 'Individual buyers' },
  { ru: 'Корпоративные клиенты', en: 'Corporate clients' },
  { ru: 'Экспаты', en: 'Expats' },
];

const REGISTRATION_BULLETS: Array<{ ru: string; en: string }> = [
  {
    ru: 'Консультация по структуре — ООО, партнёрство или компания, продвигаемая BOI',
    en: 'Business structure consultation — limited company, partnership, or BOI-promoted entity',
  },
  {
    ru: 'Проверка и резервирование названия компании в Department of Business Development',
    en: 'Company name check and reservation with the Department of Business Development',
  },
  {
    ru: 'Подготовка устава и документов акционеров',
    en: 'Preparation of articles of association and shareholder documents',
  },
  {
    ru: 'Подача заявления на регистрацию и сопровождение до одобрения',
    en: 'Registration submission and approval monitoring',
  },
  {
    ru: 'Получение налогового идентификационного номера в Revenue Department',
    en: 'Tax identification number application at the Revenue Department',
  },
  {
    ru: 'Послерегистрационный бухгалтерский и финансовый учёт',
    en: 'Post-registration bookkeeping and financial reporting support',
  },
];

const LEGALIZATION_CARDS: Card[] = [
  {
    title: { ru: 'Non-B Business Visa', en: 'Non-B Business Visa' },
    body: {
      ru: 'Требуется иностранным гражданам, ведущим бизнес в Таиланде. Мы готовим и подаём все сопутствующие документы от вашего имени.',
      en: 'Required for foreign nationals conducting business activities in Thailand. We prepare and submit all supporting documents on your behalf.',
    },
  },
  {
    title: { ru: 'Бизнес-лицензии', en: 'Business Licenses' },
    body: {
      ru: 'Некоторые виды деятельности требуют дополнительных лицензий — недвижимость, гостеприимство, общепит. Определяем и оформляем нужные разрешения под вашу отрасль.',
      en: 'Certain business types require additional licenses — such as real estate, hospitality, or food service. We identify and obtain the right permits for your industry.',
    },
  },
  {
    title: { ru: 'Разрешение на работу', en: 'Work Permit' },
    body: {
      ru: 'Разрешение на работу оформляется отдельно от визы. Ведём полный цикл подачи в Department of Employment.',
      en: 'A work permit is required separately from a visa. We manage the full application with the Department of Employment.',
    },
  },
  {
    title: { ru: 'Ежегодные продления', en: 'Annual Renewals' },
    body: {
      ru: 'Визы, разрешения на работу и часть лицензий требуют ежегодного продления. Берём все продления и комплаенс-проверки на свой график.',
      en: 'Visas, work permits, and some business licenses require annual renewal. We handle all renewals and compliance checks on your schedule.',
    },
  },
];

const STRUCTURING_TAGS = [
  { ru: 'Тайская компания', en: 'Thai limited company' },
  { ru: 'BOI promotion', en: 'BOI promotion' },
  { ru: 'Freehold и leasehold', en: 'Freehold & leasehold' },
  { ru: 'Структура долей', en: 'Shareholding structure' },
  { ru: 'Cross-border планирование', en: 'Cross-border planning' },
];

const PROTECTION_CARDS: Card[] = [
  {
    title: { ru: 'Товарный знак и патент', en: 'Trademark & Patent' },
    body: {
      ru: 'Регистрируем название бренда, логотип или изобретение в Department of Intellectual Property — чтобы предотвратить несанкционированное использование.',
      en: 'Register your brand name, logo, or invention with the Department of Intellectual Property to prevent unauthorized use.',
    },
  },
  {
    title: { ru: 'Юридические споры', en: 'Legal Disputes' },
    body: {
      ru: 'Если возник спор по активам или бизнесу — наши аффилированные юристы обеспечивают полное представительство в гражданских и коммерческих судах.',
      en: 'If a dispute arises over your assets or business, our affiliated lawyers provide full representation in civil and commercial court proceedings.',
    },
  },
  {
    title: { ru: 'Завещание', en: 'Will & Testament' },
    body: {
      ru: 'Распределение активов в Таиланде согласно вашей воле — через юридически действительное завещание, подготовленное по тайскому праву.',
      en: 'Ensure your assets in Thailand are distributed according to your wishes with a legally valid will prepared under Thai law.',
    },
  },
  {
    title: { ru: 'Нотариальное заверение', en: 'Notarization' },
    body: {
      ru: 'Заверение юридических документов — доверенностей, аффидавитов и прочих документов для бизнеса и сделок с недвижимостью.',
      en: 'Certify and notarize legal documents including powers of attorney and affidavits required for business and property transactions.',
    },
  },
];

export default async function BusinessPage() {
  const locale = (await getLocale()) as Locale;
  const isRu = locale === 'ru';

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      {/* Hero */}
      <header className="mx-auto mb-12 max-w-[860px] alab-reveal">
        <Eyebrow className="mb-8">
          {isRu ? 'Бизнес и инвестиции' : 'Business & Investment'}
        </Eyebrow>
        <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
          {isRu ? 'Бизнес и инвестиции' : 'Business & Investment'}
          <br />
          <em className="font-light italic text-gold-deep">
            {isRu ? 'в Таиланде' : 'in Thailand'}
          </em>
        </h1>
        <p className="mt-8 max-w-[620px] text-[17px] leading-[1.6] text-teak-warm">
          {isRu
            ? 'A.L.A.B Property сопровождает международных инвесторов и владельцев бизнеса в Таиланде — от регистрации компании до структурирования активов и защиты инвестиций.'
            : 'A.L.A.B Property supports international investors and business owners in Thailand — from company registration to asset structuring and investment protection.'}
        </p>
      </header>

      {/* Affiliate notice */}
      {/* <aside className="mx-auto mb-24 max-w-[860px] rounded-lg border border-[var(--line)] bg-cream/60 p-6 alab-reveal sm:p-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-deep">
          {isRu ? 'Юридическое сопровождение' : 'Legal matters managed by'} — A.L.A.B Consultant
        </p>
        <p className="text-[15px] leading-[1.6] text-teak-warm">
          {isRu
            ? 'Все юридические и бизнес-вопросы ведёт наша аффилированная юридическая фирма A.L.A.B Consultant Co., Ltd. — лицензированная практика с опытом 15+ лет в тайском корпоративном и имущественном праве. Работаем на английском и тайском.'
            : 'All business and legal services are handled by our affiliated law firm, A.L.A.B Consultant Co., Ltd. — a licensed practice with over 15 years of experience in Thai corporate and property law, serving clients in English and Thai.'}{' '}
          <a
            href="https://alabconsultant.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-deep underline-offset-4 hover:underline"
          >
            alabconsultant.com
          </a>
        </p>
      </aside> */}

      {/* Sections */}
      <div className="mx-auto max-w-[860px]">
        {/* 01 — How we help */}
        <Section
          number="01"
          title={isRu ? 'Чем мы помогаем' : 'How We Help'}
        >
          <p>
            {isRu
              ? 'Покупаете ли вы недвижимость как частное лицо, создаёте компанию или структурируете крупный инвестиционный портфель в Таиланде — A.L.A.B Property обеспечивает поддержку под ключ. Связываем вас с нужными юридическими, финансовыми и риелторскими экспертами под одной крышей.'
              : 'Whether you are looking to purchase property as an individual, set up a business entity, or structure a larger investment portfolio in Thailand, A.L.A.B Property provides end-to-end support. We connect you with the right legal, financial, and real estate expertise — all under one roof.'}
          </p>
          <p>
            {isRu
              ? 'Команда имеет опыт работы с иностранными гражданами, экспатами и институциональными инвесторами, желающими вести деятельность в Таиланде уверенно и в полном соответствии с местным законодательством.'
              : 'Our team is experienced in working with foreign nationals, expats, and institutional investors who want to operate in Thailand confidently and in full compliance with Thai law.'}
          </p>
          <TagRow tags={HELP_TAGS} locale={locale} />
        </Section>

        <Divider />

        {/* 02 — Business registration */}
        <Section
          number="02"
          title={isRu ? 'Регистрация бизнеса в Таиланде' : 'Business Registration in Thailand'}
        >
          <p>
            {isRu
              ? 'Открытие компании в Таиланде включает несколько юридических шагов. Юридическая команда A.L.A.B Consultant ведёт весь процесс регистрации — чтобы ваш бизнес был создан корректно с первого дня.'
              : 'Setting up a company in Thailand involves several legal steps. Our affiliated legal team at A.L.A.B Consultant handles the entire registration process — so your business is established correctly from day one.'}
          </p>
          <ul className="mt-2 grid gap-3">
            {REGISTRATION_BULLETS.map((b, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-[1.6] text-teak-warm">
                <span className="mt-2.5 inline-block h-1 w-1 shrink-0 rounded-full bg-gold-deep" />
                <span>{isRu ? b.ru : b.en}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Divider />

        {/* 03 — Legalize your business */}
        <Section
          number="03"
          title={isRu ? 'Что нужно для легализации бизнеса' : 'What You Need to Legalize Your Business'}
        >
          <p>
            {isRu
              ? 'Легальная работа бизнеса в Таиланде требует больше, чем регистрация. В зависимости от рода деятельности и гражданства могут потребоваться дополнительные разрешения и документы. Мы оцениваем вашу ситуацию и сопровождаем по всем требованиям.'
              : 'Operating a business legally in Thailand requires more than just registration. Depending on the nature of your business and your nationality, you may need additional permits and documentation. We assess your situation and guide you through every requirement.'}
          </p>
          <CardGrid cards={LEGALIZATION_CARDS} locale={locale} />
        </Section>

        <Divider />

        {/* 04 — Investment structuring */}
        <Section
          number="04"
          title={isRu ? 'Структурирование инвестиций' : 'Investment Structuring'}
        >
          <p>
            {isRu
              ? 'Правильное структурирование инвестиций с самого начала существенно влияет на доходность, налоги и юридические риски. Подбираем оптимальную форму владения под ваши цели — частное лицо, тайская компания или BOI-структура.'
              : 'Structuring your investment correctly from the start can significantly impact your returns, tax obligations, and legal exposure. We work with you to identify the most appropriate ownership structure for your goals — whether as an individual, through a Thai company, or via a BOI-promoted vehicle.'}
          </p>
          <p>
            {isRu
              ? 'Юристы консультируют по freehold/leasehold, структуре долей, кросс-граничному планированию активов — чтобы инвестиция была одновременно юридически чистой и финансово эффективной.'
              : 'Our legal team advises on freehold vs. leasehold structures, shareholding arrangements, and cross-border asset planning to ensure your investment is both legally sound and financially optimized.'}
          </p>
          <TagRow tags={STRUCTURING_TAGS} locale={locale} />
        </Section>

        <Divider />

        {/* 05 — Asset protection */}
        <Section
          number="05"
          title={isRu ? 'Защита активов' : 'Asset Protection'}
        >
          <p>
            {isRu
              ? 'После размещения инвестиций защита не менее важна. Обеспечиваем юридическую поддержку для защиты активов от споров, неправомерных претензий и регуляторных изменений.'
              : 'Once your investment is in place, protecting it is equally important. We provide ongoing legal support to safeguard your assets against disputes, unauthorized claims, and regulatory changes.'}
          </p>
          <CardGrid cards={PROTECTION_CARDS} locale={locale} />
        </Section>
      </div>
    </main>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="alab-reveal">
      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.24em] text-gold-deep">{number}</p>
      <h2 className="mb-8 font-serif text-[clamp(28px,3.5vw,44px)] font-normal leading-[1.1] text-teak-deep">
        {title}
      </h2>
      <div className="space-y-5 text-[16px] leading-[1.7] text-teak-warm">{children}</div>
    </article>
  );
}

function Divider() {
  return <div className="my-14 h-px bg-[var(--line)]" />;
}

function TagRow({
  tags,
  locale,
}: {
  tags: Array<{ ru: string; en: string }>;
  locale: Locale;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="rounded-full border border-[var(--line-strong)] bg-paper px-4 py-2 text-[12px] tracking-tight text-teak"
        >
          {locale === 'ru' ? tag.ru : tag.en}
        </span>
      ))}
    </div>
  );
}

function CardGrid({ cards, locale }: { cards: Card[]; locale: Locale }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--line)] bg-paper p-6 transition-colors hover:border-gold/40"
        >
          <h3 className="mb-3 font-serif text-[22px] font-normal text-teak-deep">
            {locale === 'ru' ? card.title.ru : card.title.en}
          </h3>
          <p className="text-[14px] leading-[1.65] text-teak-warm">
            {locale === 'ru' ? card.body.ru : card.body.en}
          </p>
        </div>
      ))}
    </div>
  );
}
