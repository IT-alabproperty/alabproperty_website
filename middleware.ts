import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match every path EXCEPT:
  //   - /api/*       (backend routes — locale-agnostic)
  //   - /_next/*     (Next.js internals)
  //   - /_vercel/*   (Vercel internals)
  //   - /sitemap.xml, /robots.txt, /opengraph-image, /manifest.webmanifest, /favicon*
  //   - Anything with a file extension (static assets)
  matcher: ['/((?!api|_next|_vercel|sitemap.xml|robots.txt|opengraph-image|manifest.webmanifest|.*\\..*).*)'],
}
