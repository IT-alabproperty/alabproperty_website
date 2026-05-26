import type { Metadata } from 'next';
import Script from 'next/script';
import { getLocale, getTranslations } from 'next-intl/server';
import { HeroSlideshow } from '@/components/hero-slideshow';
import { SearchSection } from '@/components/sections/search-section';
import { GuaranteeSection } from '@/components/sections/guarantee-section';
import { FeaturedPropertiesSection } from '@/components/sections/featured-properties-section';
import { ValuesSection } from '@/components/sections/values-section';
import { FinalCtaSection } from '@/components/sections/final-cta-section';
import { SectionDivider } from '@/components/ui/section-divider';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import type { Locale } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('defaultTitle'),
    description: t('pages.home.description'),
    path: '/',
  });
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });

  // WebSite JSON-LD with a SearchAction so search engines surface a sitelinks
  // search box. The query is appended as ?q= on /properties.
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('siteName'),
    url: SITE_URL,
    inLanguage: locale === 'ru' ? 'ru-RU' : 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/properties?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main>
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <HeroSlideshow />
      <SearchSection />
      <GuaranteeSection />
      <FeaturedPropertiesSection />
      <div className="bg-paper">
        <SectionDivider className="py-4" />
      </div>
      <ValuesSection />
      <FinalCtaSection />
    </main>
  );
}
