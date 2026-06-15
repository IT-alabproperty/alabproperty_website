import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Next emits /robots.txt from this. Yandex respects `host` even though Google
// ignores it — including it is harmless for Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // We DON'T disallow /_next/ even though it looks like an internal
        // path. Google must be able to fetch /_next/static/* (CSS, JS, fonts)
        // and /_next/image* (image-optimizer route) to render our pages — without
        // them the rendered DOM is missing styles and images, and Google scores
        // the page as "broken layout". Blocking these triggers Semrush's
        // "blocked internal resources" warning (we had 998 of them) and degrades
        // ranking signals because Google can't see the real page.
        //
        // /api/* is fine to disallow — those are JSON endpoints with no SEO value.
        // /gate is the password-gate UI — keep out of index.
        // /admin* + /api/admin* — operational, no public content.
        disallow: ['/gate', '/api/', '/admin', '/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: 'alabproperty.com',
  };
}
