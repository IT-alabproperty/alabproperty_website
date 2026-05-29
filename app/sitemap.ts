import type { MetadataRoute } from 'next';
import { getAllProperties } from '@/lib/db/properties';
import { getPublishedPosts } from '@/lib/db/blog';
import { SITE_URL, localizedPath } from '@/lib/seo';

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

/** Build a sitemap entry that includes hreflang alternates for ru + en. */
function entry(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap[number] {
  const ruUrl = `${SITE_URL}${localizedPath(path, 'ru')}`;
  const enUrl = `${SITE_URL}${localizedPath(path, 'en')}`;
  return {
    url: ruUrl,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        ru: ruUrl,
        en: enUrl,
        'x-default': ruUrl,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [properties, posts] = await Promise.all([
    getAllProperties().catch(() => []),
    getPublishedPosts().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) =>
    entry(r.path, now, r.changeFrequency, r.priority),
  );

  const propertyEntries: MetadataRoute.Sitemap = properties.map((p) => {
    const e = entry(`/properties/${p.slug}`, now, 'weekly', 0.8);
    // Attach property images so they show up in Google Image search.
    const imgs = [p.coverImage, ...(p.gallery ?? [])].filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    );
    if (imgs.length > 0) {
      e.images = imgs.slice(0, 10); // first 10 — Google ignores beyond
    }
    return e;
  });

  const postEntries: MetadataRoute.Sitemap = posts.map((post) =>
    entry(
      `/blog/${post.slug}`,
      new Date(post.updated_at ?? post.published_at ?? post.created_at),
      'monthly',
      0.6,
    ),
  );

  return [...staticEntries, ...propertyEntries, ...postEntries];
}
