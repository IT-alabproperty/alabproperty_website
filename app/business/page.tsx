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

const articles = [
  {
    key: 'help',
    ru: { title: 'Чем мы помогаем' },
    en: { title: 'How We Help' },
  },
  {
    key: 'registration',
    ru: { title: 'Регистрация бизнеса в Таиланде' },
    en: { title: 'Business Registration in Thailand' },
  },
  {
    key: 'legalization',
    ru: { title: 'Что нужно для легализации бизнеса' },
    en: { title: 'Requirements for Business Legalization' },
  },
  {
    key: 'structuring',
    ru: { title: 'Структурирование инвестиций' },
    en: { title: 'Investment Structuring' },
  },
  {
    key: 'protection',
    ru: { title: 'Защита активов' },
    en: { title: 'Asset Protection' },
  },
];

const LOREM_1 =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const LOREM_2 =
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
const LOREM_3 =
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.';

export default async function BusinessPage() {
  const locale = await getLocale();
  const isRu = locale === 'ru';

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      {/* Page header */}
      <header className="mx-auto mb-20 max-w-[860px] alab-reveal">
        <Eyebrow className="mb-8">
          {isRu ? 'Бизнес и инвестиции' : 'Business & Investments'}
        </Eyebrow>
        <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
          {isRu
            ? 'Бизнес и инвестиции'
            : 'Business & Investments'}
          <br />
          <em className="font-light italic text-gold-deep">
            {isRu ? 'в Таиланде' : 'in Thailand'}
          </em>
        </h1>
        <p className="mt-8 max-w-[620px] text-[17px] leading-[1.6] text-teak-warm">
          {isRu
            ? 'ALAB сопровождает международный бизнес в Таиланде: от регистрации компании до структурирования активов и защиты инвестиций.'
            : 'ALAB supports international business in Thailand — from company registration to asset structuring and investment protection.'}
        </p>
      </header>

      {/* Articles */}
      <div className="mx-auto max-w-[860px]">
        {articles.map((article, i) => (
          <article key={article.key} className="alab-reveal">
            {i > 0 && <div className="mb-14 h-px bg-[var(--line)]" />}
            <div className="mb-12">
              {/* Eyebrow number */}
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.24em] text-gold-deep">
                {String(i + 1).padStart(2, '0')}
              </p>

              {/* Title */}
              <h2 className="mb-8 font-serif text-[clamp(28px,3.5vw,44px)] font-normal leading-[1.1] text-teak-deep">
                {isRu ? article.ru.title : article.en.title}
              </h2>

              {/* Body */}
              <div className="space-y-5 text-[16px] leading-[1.8] text-teak-warm">
                <p>{LOREM_1}</p>
                <p>{LOREM_2}</p>
                <p>{LOREM_3}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
