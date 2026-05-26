import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getPublishedPosts } from '@/lib/db/blog';
import { BlogCoverImage } from '@/components/blog-cover-image';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.blog.title'),
    description: t('pages.blog.description'),
    path: '/blog',
  });
}

export default async function BlogPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Blog');
  const posts = await getPublishedPosts();

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      <header className="mx-auto mb-20 max-w-[1280px] alab-reveal">
        <Eyebrow className="mb-8">{t('eyebrow')}</Eyebrow>
        <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
          {t('titleLine1')}{' '}
          <em className="font-light italic text-gold-deep">{t('titleLine2Em')}</em>
        </h1>
      </header>

      {posts.length === 0 ? (
        <div className="mx-auto max-w-[1280px] py-24 text-center text-teak-warm alab-reveal">
          {t('empty')}
        </div>
      ) : (
        <div className="mx-auto max-w-[1280px] space-y-0">
          {posts.map((post, i) => {
            const date = formatDate(post.published_at ?? post.created_at, locale);
            const title = post.title[locale] || post.title.ru || post.slug;
            const excerpt = post.excerpt[locale] || post.excerpt.ru || '';
            return (
              <article key={post.id} className="alab-reveal">
                {i > 0 && <div className="h-px bg-[var(--line)]" />}
                <div className="py-14 sm:py-16">
                  <div className="mb-10">
                    <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
                      {date}
                    </p>
                    <h2 className="font-serif text-[clamp(26px,3vw,42px)] font-normal leading-[1.1] text-teak-deep max-w-[720px]">
                      {title}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
                    <div className="w-full sm:w-[42%] shrink-0">
                      {post.cover_image ? (
                        <BlogCoverImage
                          src={post.cover_image}
                          alt={title}
                          aspectRatio="16 / 10"
                          sizes="(min-width: 640px) 42vw, 100vw"
                          coverFocus={post.cover_focus}
                          coverZoom={post.cover_zoom}
                        />
                      ) : (
                        <div
                          className="w-full bg-cream-warm"
                          style={{ aspectRatio: '16 / 10' }}
                          aria-hidden="true"
                        >
                          <div className="flex h-full w-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.2em] text-teak/20">
                            {t('photoSoon')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      {excerpt && (
                        <p className="text-[15px] leading-[1.8] text-teak-warm whitespace-pre-wrap">
                          {excerpt}
                        </p>
                      )}
                      <div className="mt-8">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-deep transition-colors hover:text-teak-deep"
                        >
                          {t('readMore')}
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
