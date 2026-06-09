import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match every path EXCEPT:
  //   - /api/*       (backend routes — locale-agnostic)
  //   - /_next/*     (Next.js internals)
  //   - /_vercel/*   (Vercel internals)
  //   - /sitemap.xml, /robots.txt, /opengraph-image, /manifest.webmanifest
  //   - Next.js metadata routes (no file extension):
  //       /icon, /icon1, /icon2, /apple-icon
  //     If these aren't excluded the middleware rewrites them to /en/icon
  //     etc., which then 404 because they live in app/, not app/[locale]/.
  //     Result: browser favicon stays default, OG previews break.
  //   - Anything with a file extension (static assets)
  matcher: [
    '/((?!api|_next|_vercel|sitemap.xml|robots.txt|opengraph-image|manifest.webmanifest|icon|icon\\d+|apple-icon|.*\\..*).*)',
  ],
}
