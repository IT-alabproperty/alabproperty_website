import type { Metadata } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, Inter_Tight } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
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
import './globals.css';

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const [messages, cities, types, districts, tSeo] = await Promise.all([
    getMessages(),
    getCities(),
    getPropertyTypes(),
    getDistricts(),
    getTranslations({ locale, namespace: 'SEO' }),
  ]);

  // Organization JSON-LD applies to the whole site; rendered once in <head>.
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tSeo('siteName'),
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    description: tSeo('defaultDescription'),
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
