import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Next emits /robots.txt from this. Yandex respects `host` even though Google
// ignores it — including it is harmless for Google.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/gate', '/api/', '/_next/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: 'alabproperty.com',
  };
}
