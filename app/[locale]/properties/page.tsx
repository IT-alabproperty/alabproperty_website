import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { PropertyCatalog } from '@/components/property-catalog';
import { Eyebrow } from '@/components/ui/eyebrow';
import { getAllProperties } from '@/lib/db/properties';
import { getCities, getPropertyTypes, getDistricts } from '@/lib/db/taxonomy';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

// Catalog refreshes hourly — new properties become visible to Google quickly
// without a full rebuild on every request.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.properties.title'),
    description: t('pages.properties.description'),
    path: '/properties',
  });
}

export default async function PropertiesPage() {
  const [t, properties, cities, types, districts] = await Promise.all([
    getTranslations('Catalog'),
    getAllProperties(),
    getCities(),
    getPropertyTypes(),
    getDistricts(),
  ]);

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      {/* Page header */}
      <header className="mx-auto mb-16 max-w-[1280px] sm:mb-20">
        <Eyebrow className="mb-8">{t('eyebrow')}</Eyebrow>
        <h1 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
          {t('titleLine1')} <em className="font-light italic text-gold-deep">{t('titleLine1Em')}</em>{' '}
          {t('titleLine2')}
        </h1>
        <p className="mt-8 max-w-[620px] text-[17px] leading-[1.6] text-teak-warm">
          {t('subtitle')}
        </p>
      </header>

      <PropertyCatalog
        initialProperties={properties}
        cities={cities}
        types={types}
        districts={districts}
      />
    </main>
  );
}
