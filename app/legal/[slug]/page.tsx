import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getArticleBySlug, getAllArticles } from '@/lib/db/articles';
import type { Locale, Article } from '@/lib/types';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
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
