import { useTranslations } from 'next-intl';
import { PropertyCatalog } from '@/components/property-catalog';
import { Eyebrow } from '@/components/ui/eyebrow';

export default function PropertiesPage() {
  const t = useTranslations('Catalog');

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

      <PropertyCatalog />
    </main>
  );
}
