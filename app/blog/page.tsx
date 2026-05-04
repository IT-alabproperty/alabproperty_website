import { getLocale } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/eyebrow';

const posts = [
  {
    key: 'pattaya',
    dateRu: '3 мая 2026',
    dateEn: 'May 3, 2026',
    titleRu: 'Рынок Паттайи: новые возможности для инвесторов',
    titleEn: 'Pattaya Market: New Opportunities for Investors',
  },
  {
    key: 'business',
    dateRu: '15 апреля 2026',
    dateEn: 'April 15, 2026',
    titleRu: 'Как открыть бизнес в Таиланде за 30 дней',
    titleEn: 'How to Open a Business in Thailand in 30 Days',
  },
  {
    key: 'crypto',
    dateRu: '28 марта 2026',
    dateEn: 'March 28, 2026',
    titleRu: 'Криптовалюта и недвижимость: что нужно знать',
    titleEn: 'Crypto & Real Estate: What You Need to Know',
  },
];

const LOREM_SHORT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.';

export default async function BlogPage() {
  const locale = await getLocale();
  const isRu = locale === 'ru';

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      {/* Page header */}
      <header className="mx-auto mb-20 max-w-[1280px] alab-reveal">
        <Eyebrow className="mb-8">
          {isRu ? 'Блог' : 'Blog'}
        </Eyebrow>
        <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
          {isRu ? 'Актуально' : 'Market'}{' '}
          <em className="font-light italic text-gold-deep">
            {isRu ? 'о рынке' : 'Insights'}
          </em>
        </h1>
      </header>

      {/* Blog posts */}
      <div className="mx-auto max-w-[1280px] space-y-0">
        {posts.map((post, i) => (
          <article key={post.key} className="alab-reveal">
            {i > 0 && <div className="h-px bg-[var(--line)]" />}
            <div className="py-14 sm:py-16">
              {/* Top section: date + title */}
              <div className="mb-10">
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
                  {isRu ? post.dateRu : post.dateEn}
                </p>
                <h2 className="font-serif text-[clamp(26px,3vw,42px)] font-normal leading-[1.1] text-teak-deep max-w-[720px]">
                  {isRu ? post.titleRu : post.titleEn}
                </h2>
              </div>

              {/* Bottom section: image placeholder + text */}
              <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
                {/* Image placeholder (~42% width) */}
                <div className="w-full sm:w-[42%] shrink-0">
                  <div
                    className="w-full bg-cream-warm"
                    style={{ aspectRatio: '16 / 10' }}
                    aria-hidden="true"
                  >
                    <div className="flex h-full w-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.2em] text-teak/20">
                      {isRu ? 'Фото скоро' : 'Photo coming soon'}
                    </div>
                  </div>
                </div>

                {/* Text content (~58% width) */}
                <div className="flex-1">
                  <p className="text-[15px] leading-[1.8] text-teak-warm">
                    {LOREM_SHORT}
                  </p>
                  <p className="mt-5 text-[15px] leading-[1.8] text-teak-warm">
                    {LOREM_SHORT}
                  </p>
                  <div className="mt-8">
                    <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-deep transition-colors hover:text-teak-deep cursor-pointer">
                      {isRu ? 'Читать далее' : 'Read more'}
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
