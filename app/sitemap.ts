import type { MetadataRoute } from 'next';
import { getAllProperties } from '@/lib/db/properties';
import { getPublishedPosts } from '@/lib/db/blog';
import { SITE_URL } from '@/lib/seo';

// Refresh the sitemap hourly so new posts/properties appear without a redeploy.
export const revalidate = 3600;

type StaticEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

const STATIC_ROUTES: StaticEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/properties', changeFrequency: 'daily', priority: 0.9 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  // /business and /legal hidden until copy is finalised — see nav.tsx note.
  // Restore both entries and remove the noindex from their pages when ready.
  { path: '/contacts', changeFrequency: 'yearly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Pull dynamic content first; failures degrade gracefully to static-only.
  const [properties, posts] = await Promise.all([
    getAllProperties().catch(() => []),
    getPublishedPosts().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const propertyEntries: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/properties/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at ?? post.published_at ?? post.created_at),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...propertyEntries, ...postEntries];
}
