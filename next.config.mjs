import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next.js сам конвертит в WebP/AVIF, делает несколько размеров под devicePixelRatio,
    // и кэширует на 31 день.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage — bucket property-photos
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default withNextIntl(nextConfig);
