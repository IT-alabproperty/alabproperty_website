import type { MetadataRoute } from 'next'

/**
 * PWA manifest — controls how the site behaves when the user picks
 * "Add to Home Screen" on iOS / Android. Sets the icon, splash colour,
 * standalone mode (no browser chrome), and display name.
 *
 * Icons here mirror what app/icon*.tsx generate — Next routes them under
 * /icon, /icon1, /icon2, /apple-icon and the manifest just references them.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ALAB Property',
    short_name: 'ALAB',
    description: 'Real estate and legal counsel in Thailand',
    start_url: '/',
    display: 'standalone',
    // Splash colour: paper-cream (matches the body background, so the launch
    // transition feels seamless from icon → page).
    background_color: '#FBF8F2',
    // Status-bar tint on Android: teak-deep, our primary brand colour.
    theme_color: '#2B1810',
    orientation: 'portrait',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/icon1', sizes: '192x192', type: 'image/png' },
      { src: '/icon2', sizes: '512x512', type: 'image/png' },
      // Apple icon registered separately by metadata.appleWebApp.
      // Marking 512 as `purpose: any` (default) — for a proper maskable
      // icon Android would need a version with 20% safe-area padding,
      // skipped here to keep the set lean.
      { src: '/icon2', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
