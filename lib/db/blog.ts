import { supabase } from '../supabase'

export interface BlogBlockHeading { type: 'heading'; text: { ru: string; en: string } }
export interface BlogBlockParagraph { type: 'paragraph'; text: { ru: string; en: string } }
export interface BlogBlockImage { type: 'image'; src: string; alt?: { ru: string; en: string } }
export type BlogBlock = BlogBlockHeading | BlogBlockParagraph | BlogBlockImage

export interface BlogPost {
  id: string
  slug: string
  title: { ru: string; en: string }
  cover_image: string | null
  cover_focus: string | null
  cover_zoom: number | null
  excerpt: { ru: string; en: string }
  blocks: BlogBlock[]
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title ?? { ru: '', en: '' },
    cover_image: row.cover_image ?? null,
    cover_focus: row.cover_focus ?? null,
    cover_zoom: row.cover_zoom != null ? Number(row.cover_zoom) : null,
    excerpt: row.excerpt ?? { ru: '', en: '' },
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('[db/blog] getPublishedPosts error:', error.message)
    return []
  }
  return (data ?? []).map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[db/blog] getPostBySlug error:', error.message)
    return null
  }
  return data ? rowToPost(data) : null
}
