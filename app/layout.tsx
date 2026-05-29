// Minimal root layout. Next.js requires a root layout at this level;
// all actual UI (fonts, providers, <html>) lives in app/[locale]/layout.tsx,
// reached via the next-intl middleware. Non-locale routes (sitemap, robots,
// api) don't pass through any layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
