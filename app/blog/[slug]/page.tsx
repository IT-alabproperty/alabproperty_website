import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getPostBySlug, type BlogBlock } from '@/lib/db/blog';
import { buildMetadata, SITE_URL, truncate } from '@/lib/seo';
import type { Locale } from '@/lib/types';
import { BlogBlockImage } from '@/components/blog-block-image';
import { BlogCoverImage } from '@/components/blog-cover-image';

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function BlockRenderer({ block, locale }: { block: BlogBlock; locale: Locale }) {
  if (block.type === 'heading') {
    const text = block.text[locale] || block.text.ru;
    if (!text) return null;
    return (
      <h2 className="alab-reveal mt-16 mb-6 font-serif text-[clamp(24px,3vw,36px)] font-normal leading-[1.15] text-teak-deep">
        {text}
      </h2>
    );
  }
  if (block.type === 'paragraph') {
    const text = block.text[locale] || block.text.ru;
    if (!text) return null;
    return (
      <p className="alab-reveal mb-6 text-[17px] leading-[1.75] text-teak-warm whitespace-pre-wrap">
        {text}
      </p>
    );
  }
  if (block.type === 'image' && block.src) {
    const alt = block.alt?.[locale] || block.alt?.ru || '';
    return (
      <figure className="alab-reveal my-12">
        <BlogBlockImage src={block.src} alt={alt} />
        {alt && (
          <figcaption className="mt-3 text-center text-[12px] italic tracking-tight text-teak-warm/70">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const post = await getPostBySlug(slug);
  if (!post) {
    const t = await getTranslations({ locale, namespace: 'SEO' });
    return buildMetadata({
      locale,
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      path: `/blog/${slug}`,
      noindex: true,
    });
  }
  const title = post.title[locale] || post.title.ru || post.slug;
  const description = truncate(
    post.excerpt[locale] || post.excerpt.ru || '',
    160,
  );
  return buildMetadata({
    locale,
    title,
    description,
    path: `/blog/${post.slug}`,
    image: post.cover_image ?? undefined,
    imageAlt: title,
    ogType: 'article',
  });
}

/** Flatten the structured blog blocks into a plain-text articleBody for JSON-LD. */
function blocksToPlainText(blocks: BlogBlock[], locale: Locale): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'heading' || block.type === 'paragraph') {
      const text = block.text[locale] || block.text.ru;
      if (text) parts.push(text);
    }
  }
  return parts.join('\n\n');
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Blog');

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const title = post.title[locale] || post.title.ru || post.slug;
  const date = formatDate(post.published_at ?? post.created_at, locale);

  const blogPostingLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: truncate(post.excerpt[locale] || post.excerpt.ru || '', 200) || undefined,
    image: post.cover_image || undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    inLanguage: locale === 'ru' ? 'ru-RU' : 'en-US',
    author: {
      '@type': 'Organization',
      name: 'ALAB Property',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ALAB Property',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/opengraph-image` },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    articleBody: blocksToPlainText(post.blocks, locale) || undefined,
  };

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      <Script
        id={`ld-blogposting-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <article className="mx-auto max-w-[820px]">
        <Link
          href="/blog"
          className="alab-reveal mb-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-gold-deep"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.75} />
          {t('back')}
        </Link>

        <header className="alab-reveal mb-14">
          <Eyebrow className="mb-6">{t('eyebrow')}</Eyebrow>
          {date && (
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              {date}
            </p>
          )}
          <h1 className="font-serif text-[clamp(34px,4.5vw,58px)] font-normal leading-[1.05] tracking-[-0.01em] text-teak-deep">
            {title}
          </h1>
        </header>

        {post.cover_image && (
          <div className="alab-reveal mb-14 overflow-hidden">
            <BlogCoverImage
              src={post.cover_image}
              alt={title}
              aspectRatio="16 / 9"
              sizes="(min-width: 1024px) 820px, 100vw"
              priority
              coverFocus={post.cover_focus}
              coverZoom={post.cover_zoom}
            />
          </div>
        )}

        <div className="alab-reveal">
          {post.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} locale={locale} />
          ))}
        </div>
      </article>
    </main>
  );
}
