import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, Inter_Tight } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { CurrencyProvider } from '@/components/currency-context';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { ScrollRevealMount } from '@/components/scroll-reveal';
import { LoadingScreen } from '@/components/loading-screen';
import { ProposalModalProvider } from '@/components/proposal-modal';
import { TaxonomyProvider } from '@/components/taxonomy-context';
import { getCities, getPropertyTypes, getDistricts } from '@/lib/db/taxonomy';
import { SITE_ORIGIN, SITE_URL, OG_LOCALE } from '@/lib/seo';
import type { Locale } from '@/lib/types';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n/config';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (locales.includes(rawLocale as Locale) ? rawLocale : 'ru') as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });

  const defaultTitle = t('defaultTitle');
  const description = t('defaultDescription');

  return {
    metadataBase: SITE_ORIGIN,
    title: {
      default: defaultTitle,
      template: t('titleTemplate'),
    },
    description,
    applicationName: t('siteName'),
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: t('siteName'),
      title: defaultTitle,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: locale === 'ru' ? OG_LOCALE.en : OG_LOCALE.ru,
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description,
    },
    robots: { index: true, follow: true },
    // Site-verification env vars are read at build/runtime. When unset, Next
    // simply skips the meta tag — no need for a placeholder.
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = rawLocale as Locale;
  // Required for server components to use locale (instead of cookie-based fallback).
  setRequestLocale(locale);
  const [messages, cities, types, districts, tSeo] = await Promise.all([
    getMessages(),
    getCities(),
    getPropertyTypes(),
    getDistricts(),
    getTranslations({ locale, namespace: 'SEO' }),
  ]);

  // RealEstateAgent / LocalBusiness JSON-LD — more specific than Organization
  // and unlocks Google's "businesses" treatment (Maps cards, knowledge panel).
  // Stays on the home page only — per Google's guidance.
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'RealEstateAgent'],
    name: tSeo('siteName'),
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    image: `${SITE_URL}/opengraph-image`,
    description: tSeo('defaultDescription'),
    priceRange: '$$$$',
    areaServed: [
      { '@type': 'City', name: 'Bangkok', containedInPlace: { '@type': 'Country', name: 'Thailand' } },
      { '@type': 'City', name: 'Pattaya', containedInPlace: { '@type': 'Country', name: 'Thailand' } },
    ],
    knowsLanguage: ['ru', 'en', 'th'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'property@alabproperty.com',
        contactType: 'customer support',
        availableLanguage: ['en', 'ru'],
        areaServed: 'TH',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TH',
      addressLocality: 'Bangkok',
    },
    // Approximate Bangkok CBD coordinates — Google uses this for local pack.
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 13.7563,
      longitude: 100.5018,
    },
    sameAs: [
      // Add social profiles here as they go live (LinkedIn, Instagram, etc.)
    ],
  };

  return (
    <html lang={locale} className={`${cormorant.variable} ${interTight.variable}`}>
      <body>
        <Script
          id="ld-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          // Stringify once on the server; no user data is interpolated here.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TaxonomyProvider cities={cities} types={types} districts={districts}>
            <CurrencyProvider locale={locale}>
              <ProposalModalProvider>
                <LoadingScreen />
                <div className="alab-wood-texture" aria-hidden="true" />
                <div className="alab-grain" aria-hidden="true" />
                <Nav />
                {children}
                <Footer />
                <ScrollRevealMount />
              </ProposalModalProvider>
            </CurrencyProvider>
          </TaxonomyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
