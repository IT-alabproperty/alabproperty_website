import type {
  Article,
  ArticleCategory,
  LocalizedText,
} from '../types'
import { supabase } from '../supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToArticle(row: any): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title as LocalizedText,
    excerpt: (row.excerpt ?? { ru: '', en: '' }) as LocalizedText,
    category: row.category as ArticleCategory,
    publishedAt: row.published_at as string,
    readingTimeMin: row.reading_time_min ?? 5,
    coverImage: row.cover_image ?? '',
    author: (row.author ?? { ru: '', en: '' }) as LocalizedText,
    contentPreview: (row.content_preview ?? { ru: '', en: '' }) as LocalizedText,
  }
}

export async function getAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('[db/articles] getAllArticles error:', error)
    return []
  }

  return (data ?? []).map(rowToArticle)
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[db/articles] getArticleBySlug error:', error)
    }
    return null
  }

  return data ? rowToArticle(data) : null
}

export async function getRecentArticles(limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[db/articles] getRecentArticles error:', error)
    return []
  }

  return (data ?? []).map(rowToArticle)
}

export async function getArticlesByCategory(
  category: ArticleCategory,
): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('[db/articles] getArticlesByCategory error:', error)
    return []
  }

  return (data ?? []).map(rowToArticle)
}
