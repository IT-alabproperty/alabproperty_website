import { Link } from '@/lib/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getFeaturedProperties } from '@/lib/db/properties';
import { PropertyCard } from '@/components/property-card';
import { Eyebrow } from '@/components/ui/eyebrow';

export async function FeaturedPropertiesSection() {
  const t = await getTranslations('FeaturedProperties');
  const properties = await getFeaturedProperties(3);

  return (
    <section id="properties" className="relative bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pb-40 sm:pt-40 lg:px-14">
      <div className="mx-auto mb-20 flex max-w-[1200px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end lg:gap-16">
        <div className="alab-reveal">
          <Eyebrow className="mb-10">{t('tag')}</Eyebrow>
          <h2 className="font-serif text-[clamp(40px,5vw,68px)] font-normal leading-none tracking-[-0.02em] text-teak-deep">
            {t('titleLine1')} <em className="font-light italic text-gold-deep">{t('titleLine1Em')}</em>
            <br />
            {t('titleLine2')}
          </h2>
        </div>

        <Link
          href="/properties"
          className="alab-reveal inline-flex items-center gap-2 whitespace-nowrap border-b border-[var(--line-strong)] pb-1 text-xs uppercase tracking-[0.16em] text-teak transition-colors duration-400 hover:border-gold-deep hover:text-gold-deep"
        >
          {t('viewAll')}
          <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <div key={p.id} className="alab-reveal">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
