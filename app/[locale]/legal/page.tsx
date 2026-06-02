import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { ArrowRight, Building2, ShieldCheck, ListChecks, Receipt, Wallet } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Link } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.legal.title'),
    description: t('pages.legal.description'),
    path: '/legal',
  });
}

interface Card {
  title: { ru: string; en: string };
  body: { ru: string; en: string };
  tags?: Array<{ ru: string; en: string }>;
}

const OWNERSHIP_CARDS: Card[] = [
  {
    title: { ru: 'Freehold', en: 'Freehold' },
    body: {
      ru: 'Полная собственность без ограничения по сроку. Доступно гражданам Таиланда и иностранцам — для кондоминиумов по Condominium Act (иностранная квота до 49% площади здания).',
      en: 'Full ownership of the property with no time limit. Available to Thai nationals and foreign nationals for condominium units under the Condominium Act (foreign quota up to 49% of the building).',
    },
    tags: [
      { ru: 'Chanote — основной титул', en: 'Chanote title deed' },
      { ru: 'Condominium Act', en: 'Condominium Act' },
      { ru: 'Иностранная квота', en: 'Foreign quota' },
    ],
  },
  {
    title: { ru: 'Leasehold', en: 'Leasehold' },
    body: {
      ru: 'Долгосрочная аренда — обычно 30 лет с правом продления по договору. Распространённый и юридически признанный вариант для иностранных покупателей, которые не могут оформить freehold на землю или дом.',
      en: 'Long-term lease agreements typically for 30 years, renewable by contract. A common and legally recognized option for foreign buyers who cannot hold freehold title on land or houses.',
    },
    tags: [
      { ru: 'Аренда 30 лет', en: '30-year lease' },
      { ru: 'С правом продления', en: 'Renewable' },
      { ru: 'Земля и дом', en: 'Land & house' },
    ],
  },
];

const DUE_DILIGENCE_TAGS = [
  { ru: 'Проверка титула', en: 'Title deed check' },
  { ru: 'Encumbrance search', en: 'Encumbrance search' },
  { ru: 'Проверка застройщика', en: 'Developer background' },
  { ru: 'Лицензия проекта', en: 'Project permit' },
];

const JOURNEY_TAGS = [
  { ru: 'Депозит', en: 'Deposit' },
  { ru: 'Договор купли-продажи', en: 'Sales & Purchase Agreement' },
  { ru: 'Регистрация в Land Department', en: 'Land Department transfer' },
  { ru: 'Передача титула', en: 'Title deed handover' },
];

const FEES_TAGS = [
  { ru: 'Transfer fee 2%', en: 'Transfer fee 2%' },
  { ru: 'Specific Business Tax (SBT)', en: 'Specific Business Tax (SBT)' },
  { ru: 'Гербовый сбор', en: 'Stamp duty' },
  { ru: 'Withholding tax', en: 'Withholding tax' },
];

// ERC-20 is highlighted because that's the network ALAB actually settles
// USDT on. The others are listed as also-accepted assets.
// Hero grid — the "old design" 5-card teaser that links into the long-form
// sections below. Same icon/eyebrow/title/rule pattern as the previous
// LegalTrustSection on the home page, so the visual language stays familiar.
interface OverviewCard {
  anchor: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  tag: { ru: string; en: string };
  title: { ru: string; en: string };
  summary: { ru: string; en: string };
  note: { ru: string; en: string };
}

const OVERVIEW_CARDS: OverviewCard[] = [
  {
    anchor: 'ownership',
    icon: Building2,
    tag: { ru: 'Типы собственности', en: 'Ownership Types' },
    title: { ru: 'Freehold & Leasehold', en: 'Freehold & Leasehold' },
    summary: {
      ru: 'Как оформить владение в Таиланде — freehold для кондо, leasehold для земли и виллы.',
      en: 'How ownership works in Thailand — freehold for condos, leasehold for land and villas.',
    },
    note: { ru: 'Chanote · Condominium Act', en: 'Chanote · Condominium Act' },
  },
  {
    anchor: 'due-diligence',
    icon: ShieldCheck,
    tag: { ru: 'Due Diligence', en: 'Due Diligence' },
    title: { ru: 'Проверка титула и застройщика', en: 'Developer & Title Verification' },
    summary: {
      ru: 'Проверяем права на землю, обременения, репутацию застройщика и лицензии проекта.',
      en: 'We verify land rights, encumbrances, developer credibility and project licences.',
    },
    note: { ru: 'Title · Permits · Developer', en: 'Title · Permits · Developer' },
  },
  {
    anchor: 'journey',
    icon: ListChecks,
    tag: { ru: 'Этапы сделки', en: 'Transaction Path' },
    title: { ru: 'От депозита до ключей', en: 'From Deposit to Keys' },
    summary: {
      ru: 'Сопровождаем на каждом этапе — от резервации до регистрации в Land Department.',
      en: 'We guide you at every step — from reservation to Land Department registration.',
    },
    note: { ru: 'Deposit · SPA · Transfer', en: 'Deposit · SPA · Transfer' },
  },
  {
    anchor: 'fees',
    icon: Receipt,
    tag: { ru: 'Налоги и сборы', en: 'Tax & Fees' },
    title: { ru: 'Прозрачная структура затрат', en: 'Transparent Cost Structure' },
    summary: {
      ru: 'Полная раскладка расходов заранее — никаких скрытых платежей в процессе сделки.',
      en: 'Full cost breakdown upfront — no hidden charges in the process.',
    },
    note: { ru: 'Transfer fee · SBT · Stamp duty', en: 'Transfer fee · SBT · Stamp duty' },
  },
  {
    anchor: 'crypto',
    icon: Wallet,
    tag: { ru: 'Оплата криптой', en: 'Crypto Transactions' },
    title: { ru: 'Сделки с криптовалютой', en: 'Cryptocurrency-Assisted Transactions' },
    summary: {
      ru: 'Структурируем оплату криптой в полном соответствии с тайским законодательством.',
      en: 'We structure crypto-based payments in full compliance with Thai law.',
    },
    note: { ru: 'USDT (ERC-20)', en: 'USDT (ERC-20)' },
  },
];

// Only USDT on ERC-20 is processed as standard. Anything else (larger volume,
// alternative tokens, OTC arrangements) is handled case-by-case via direct
// contact — see CTA in the Crypto Transactions section.
const CRYPTO_TAGS: Array<{ ru: string; en: string; accent?: boolean }> = [
  { ru: 'USDT (ERC-20)', en: 'USDT (ERC-20)', accent: true },
];

export default async function LegalPage() {
  const locale = (await getLocale()) as Locale;
  const isRu = locale === 'ru';

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      {/* Hero */}
      <header className="mx-auto mb-12 max-w-[860px] alab-reveal">
        <Eyebrow className="mb-8">{isRu ? 'Legal' : 'Legal'}</Eyebrow>
        <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
          {isRu ? 'Защищённые инвестиции' : 'Secure Investments'}
          <br />
          <em className="font-light italic text-gold-deep">
            {isRu ? 'и юридическая ясность' : '& Legal Clarity'}
          </em>
        </h1>
        <p className="mt-8 max-w-[620px] text-[17px] leading-[1.6] text-teak-warm">
          {isRu
            ? 'Покупка недвижимости в Таиланде сопряжена с юридическими шагами, требующими экспертного сопровождения. Каждая сделка через A.L.A.B Property подкреплена квалифицированной правовой поддержкой — вы инвестируете с полной уверенностью.'
            : 'Buying property in Thailand comes with legal steps that require expert guidance. Every transaction through A.L.A.B Property is backed by qualified legal support — so you invest with full confidence.'}
        </p>
      </header>

      {/* Affiliate notice */}
      {/* <aside className="mx-auto mb-24 max-w-[860px] rounded-lg border border-[var(--line)] bg-cream/60 p-6 alab-reveal sm:p-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-deep">
          {isRu ? 'Юридическое сопровождение' : 'Legal matters managed by'} — A.L.A.B Consultant
        </p>
        <p className="text-[15px] leading-[1.6] text-teak-warm">
          {isRu
            ? 'Все юридические услуги ведёт аффилированная фирма A.L.A.B Consultant Co., Ltd. — лицензированная практика с опытом 15+ лет в тайском имущественном и коммерческом праве. Работаем на английском и тайском.'
            : 'All legal services are handled by our affiliated law firm, A.L.A.B Consultant Co., Ltd. — a licensed law practice with over 15 years of experience in Thai property and business law, serving clients in English and Thai.'}{' '}
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

      {/* Overview teaser — old-design 5-card grid that previously sat on the
          home page. Doubles as a visual table of contents: each card scrolls
          to the corresponding deep-dive section below. */}
      <section className="mx-auto mb-24 max-w-[1200px] alab-reveal">
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {OVERVIEW_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.anchor}
                href={`#${card.anchor}`}
                className="group relative flex flex-col bg-paper p-8 transition-colors lg:p-9"
              >
                {/* hover gold top border */}
                <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gold-deep transition-transform duration-500 group-hover:scale-x-100" />

                {/* icon */}
                <span className="mb-7 inline-flex h-11 w-11 items-center justify-center border border-line bg-cream-warm text-gold-deep transition-colors duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
                  <Icon size={18} strokeWidth={1.4} />
                </span>

                {/* eyebrow */}
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold-deep">
                  {isRu ? card.tag.ru : card.tag.en}
                </p>

                {/* title */}
                <h3 className="mb-4 font-serif text-[20px] font-normal leading-[1.2] text-teak-deep">
                  {isRu ? card.title.ru : card.title.en}
                </h3>

                {/* gold rule */}
                <span className="mb-5 inline-block h-px w-8 bg-gold/40 transition-all duration-500 group-hover:w-14 group-hover:bg-gold-deep" />

                {/* summary */}
                <p className="flex-1 text-[13px] leading-[1.7] text-teak-warm">
                  {isRu ? card.summary.ru : card.summary.en}
                </p>

                {/* bottom note */}
                <p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-teak/30">
                  {isRu ? card.note.ru : card.note.en}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      <div className="mx-auto max-w-[860px] space-y-20">
        {/* Types of ownership */}
        <Section
          id="ownership"
          eyebrow={isRu ? 'Типы собственности' : 'Types of Ownership'}
          title={isRu ? 'Как оформить владение в Таиланде' : 'How ownership works in Thailand'}
        >
          <CardGrid cards={OWNERSHIP_CARDS} locale={locale} />
        </Section>

        {/* Due Diligence */}
        <Section
          id="due-diligence"
          eyebrow={isRu ? 'Due Diligence' : 'Due Diligence'}
          title={isRu ? 'Проверка застройщика и титула' : 'Developer & Title Verification'}
        >
          <p>
            {isRu
              ? 'До любой покупки наша юридическая команда проверяет права на землю, тип титула, обременения, репутацию застройщика и лицензии проекта. Мы убеждаемся, что объект юридически чист и свободен от скрытых обязательств — никаких сюрпризов после подписания.'
              : 'Before any purchase, our legal team verifies land ownership rights, title deed type, encumbrances, developer credibility, and project licenses. We ensure what is being sold is legally clear and free of hidden liabilities — so there are no surprises after signing.'}
          </p>
          <TagRow tags={DUE_DILIGENCE_TAGS} locale={locale} />
        </Section>

        {/* Transaction journey */}
        <Section
          id="journey"
          eyebrow={isRu ? 'Этапы сделки' : 'Transaction Journey'}
          title={isRu ? 'От депозита до ключей' : 'From Deposit to Keys'}
        >
          <p>
            {isRu
              ? 'Сопровождаем на каждом этапе сделки — от первого резервационного депозита, через Sales & Purchase Agreement, до официальной передачи прав в Land Department. Юристы проверяют каждый документ на каждом шаге.'
              : 'We guide you through every stage of the transaction — from the initial reservation deposit, through the Sales & Purchase Agreement, all the way to the official transfer of ownership at the Land Department. Our legal team reviews every document at each step.'}
          </p>
          <TagRow tags={JOURNEY_TAGS} locale={locale} />
        </Section>

        {/* Taxes & fees */}
        <Section
          id="fees"
          eyebrow={isRu ? 'Налоги и комиссии' : 'Taxes & Fees'}
          title={isRu ? 'Прозрачная структура затрат' : 'Transparent Cost Structure'}
        >
          <p>
            {isRu
              ? 'Переход прав в Таиланде включает несколько государственных сборов и налогов. Даём ясную раскладку расходов заранее — вы точно знаете чего ждать, без скрытых платежей. Сборы рассчитываются на основе оценочной стоимости объекта и срока владения продавца.'
              : 'Property transfers in Thailand involve several government fees and taxes. We provide a clear cost breakdown upfront so you know exactly what to expect — with no hidden charges. Costs are calculated based on the property’s appraised value and holding period.'}
          </p>
          <TagRow tags={FEES_TAGS} locale={locale} />
        </Section>

        {/* Crypto transactions */}
        <Section
          id="crypto"
          eyebrow={isRu ? 'Оплата криптой' : 'Crypto Transactions'}
          title={isRu ? 'Сделки с использованием криптовалюты' : 'Cryptocurrency-Assisted Transactions'}
        >
          <p>
            {isRu
              ? 'A.L.A.B Property поддерживает клиентов, желающих использовать криптовалюту как часть процесса покупки недвижимости. Юристы выстраивают сделку в полном соответствии с тайским законодательством — защищая как покупателя, так и продавца.'
              : 'A.L.A.B Property supports clients who wish to use cryptocurrency as part of their property purchase process. Our legal team ensures all transactions are structured in full compliance with Thai law — protecting both buyer and seller throughout the process.'}
          </p>
          <TagRow tags={CRYPTO_TAGS} locale={locale} />

          {/* CTA — only USDT-ERC20 is standard. Everything else is OTC / case-by-case. */}
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/[0.05] p-5 sm:p-6">
            <p className="text-[14px] leading-[1.65] text-teak-warm">
              {isRu
                ? 'Для других валют, крупных сумм или нестандартных схем расчёта — обсуждаем индивидуально.'
                : 'For other currencies, larger volumes, or non-standard settlement structures — we discuss case-by-case.'}
            </p>
            <Link
              href="/contacts"
              className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-gold-deep transition-colors hover:text-teak-deep"
            >
              {isRu ? 'Связаться с нами' : 'Contact us'}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt offsets the smooth-scroll target by the height of the fixed
    // nav (~112 px) so anchored sections aren't hidden under it.
    <section id={id} className="alab-reveal scroll-mt-28">
      <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.24em] text-gold-deep">{eyebrow}</p>
      <h2 className="mb-8 font-serif text-[clamp(28px,3.5vw,40px)] font-normal leading-[1.15] text-teak-deep">
        {title}
      </h2>
      <div className="space-y-5 text-[16px] leading-[1.7] text-teak-warm">{children}</div>
    </section>
  );
}

function TagRow({
  tags,
  locale,
}: {
  tags: Array<{ ru: string; en: string; accent?: boolean }>;
  locale: Locale;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={i}
          className={
            tag.accent
              ? 'rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-[12px] font-semibold tracking-tight text-gold-deep'
              : 'rounded-full border border-[var(--line-strong)] bg-paper px-4 py-2 text-[12px] tracking-tight text-teak'
          }
        >
          {locale === 'ru' ? tag.ru : tag.en}
        </span>
      ))}
    </div>
  );
}

function CardGrid({ cards, locale }: { cards: Card[]; locale: Locale }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--line)] bg-paper p-6 transition-colors hover:border-gold/40 sm:p-7"
        >
          <h3 className="mb-3 font-serif text-[24px] font-normal text-teak-deep">
            {locale === 'ru' ? card.title.ru : card.title.en}
          </h3>
          <p className="mb-4 text-[14px] leading-[1.65] text-teak-warm">
            {locale === 'ru' ? card.body.ru : card.body.en}
          </p>
          {card.tags && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag, j) => (
                <span
                  key={j}
                  className="rounded-full border border-[var(--line-strong)] bg-cream/30 px-2.5 py-1 text-[11px] tracking-tight text-teak"
                >
                  {locale === 'ru' ? tag.ru : tag.en}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
