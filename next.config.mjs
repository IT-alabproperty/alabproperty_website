import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/**
 * Security headers applied to every response. Skip a strict CSP for now —
 * Next inline styles + framer-motion + dynamic /_next/image URLs make a
 * meaningful CSP a multi-day balancing act; the headers below are the
 * cheap wins that cost nothing in compatibility.
 */
const securityHeaders = [
  // Prevent the site from being framed by other origins → no clickjacking.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Browsers must not MIME-sniff. Helps stop a hostile .jpg from running as JS.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak the full URL we came from on outbound clicks.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down permissions APIs we never use (microphone/camera/geo).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Force HTTPS for two years incl. subdomains. Browsers cache this.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Yandex/Google prefer one canonical URL per page. Stay on the no-slash form.
  trailingSlash: false,
  images: {
    // Next.js сам конвертит в WebP/AVIF, делает несколько размеров под devicePixelRatio,
    // и кэширует на 31 день.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage — bucket property-photos / blog-photos.
      // Pin to our actual project subdomain instead of '**.supabase.co' so a
      // random other Supabase project can't ride our optimizer.
      { protocol: 'https', hostname: 'vfhzorhzamhmmskoejfa.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
