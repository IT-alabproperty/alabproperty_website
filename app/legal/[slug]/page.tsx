import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { getArticleBySlug, getAllArticles } from '@/lib/db/articles';
import { buildMetadata, truncate } from '@/lib/seo';
import type { Locale, Article } from '@/lib/types';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const article = await getArticleBySlug(slug);
  if (!article) {
    const t = await getTranslations({ locale, namespace: 'SEO' });
    return buildMetadata({
      locale,
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      path: `/legal/${slug}`,
      noindex: true,
    });
  }
  const title = article.title[locale] || article.title.ru;
  const description = truncate(
    article.excerpt[locale] || article.excerpt.ru || article.contentPreview?.[locale] || '',
    160,
  );
  return buildMetadata({
    locale,
    title,
    description,
    path: `/legal/${article.slug}`,
    image: article.coverImage || undefined,
    imageAlt: title,
    ogType: 'article',
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return <ArticleContent article={article} />;
}

function ArticleContent({ article }: { article: Article }) {
  const locale = useLocale() as Locale;

  return (
    <main className="min-h-screen px-14 pb-30 pt-40">
      <article className="mx-auto max-w-[760px]">
        <div className="text-xs uppercase tracking-[0.18em] text-gold-deep">{article.category}</div>
        <h1 className="mt-3 font-serif text-5xl font-normal tracking-[-0.02em] text-teak-deep">
          {article.title[locale]}
        </h1>
        <p className="mt-6 text-lg italic text-muted">{article.author[locale]}</p>
        <p className="mt-12 text-lg leading-[1.7] text-teak-warm">{article.contentPreview[locale]}</p>
      </article>
    </main>
  );
}
