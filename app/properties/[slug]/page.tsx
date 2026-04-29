import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft, BedDouble, Bath, Maximize, Building2, Calendar,
  ShieldCheck, Eye, MapPin,
} from 'lucide-react';
import { getPropertyBySlug, getRelatedProperties, mockProperties } from '@/lib/mock-properties';
import { PropertyGallery } from '@/components/property/property-gallery';
import { RoiCalculator } from '@/components/property/roi-calculator';
import { ContactForm } from '@/components/property/contact-form';
import { PropertyMapClient } from '@/components/property/property-map-client';
import { PropertyCard } from '@/components/property-card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { PriceDisplay } from '@/components/property/price-display';
import { ProposalButton } from '@/components/proposal-button';
import type { Locale, Property, Amenity } from '@/lib/types';

export function generateStaticParams() {
  return mockProperties.map((p) => ({ slug: p.slug }));
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) notFound();

  return <PropertyContent property={property} />;
}

function PropertyContent({ property }: { property: Property }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('PropertyPage');
  const tCatalog = useTranslations('Catalog');
  const tDistrict = useTranslations('District');
  const tType = useTranslations('PropertyType');
  const tDeal = useTranslations('Deal');
  const tProperty = useTranslations('Property');
  const tOwnership = useTranslations('Ownership');
  const tTags = useTranslations('Tags');
  const tAmenities = useTranslations('Amenities');

  const related = getRelatedProperties(property.slug, 3);

  return (
    <main className="min-h-screen bg-paper pt-28 sm:pt-32">
      {/* Top bar with back link */}
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-14">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted transition-colors hover:text-gold-deep"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t('backToCatalog')}
        </Link>
      </div>

      {/* Header */}
      <header className="mx-auto mt-8 max-w-[1280px] px-6 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3" strokeWidth={2} />
                {tDistrict(property.district)}
              </span>
              <span>·</span>
              <span>{tType(property.type)}</span>
              {property.tags.includes('investor-pick') && (
                <>
                  <span>·</span>
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-gold-deep">
                    {tTags('investor-pick')}
                  </span>
                </>
              )}
            </div>
            <h1 className="font-serif text-[clamp(36px,5vw,64px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
              {property.name[locale]}
            </h1>
            <p className="mt-3 text-base text-muted sm:text-lg">{property.address[locale]}</p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <PriceDisplay priceThb={property.priceThb} deal={property.deal} areaSqm={property.areaSqm} />
            <ProposalButton
              property={{ id: property.id, slug: property.slug, name: property.name }}
              label={locale === 'ru' ? 'Получить предложение' : 'Get a Proposal'}
              variant="gold"
            />
          </div>
        </div>
      </header>

      {/* Gallery */}
      <section className="mx-auto mt-12 max-w-[1280px] px-6 sm:px-10 lg:px-14">
        <PropertyGallery images={property.gallery} name={property.name[locale]} />
      </section>

      {/* Specs strip */}
      <section className="mx-auto mt-12 max-w-[1280px] px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[var(--line)] sm:grid-cols-4 lg:grid-cols-6">
          <SpecCell icon={<BedDouble className="h-4 w-4" strokeWidth={1.5} />} label={tCatalog('filterPanel.bedrooms')} value={`${property.bedrooms}`} />
          <SpecCell icon={<Bath className="h-4 w-4" strokeWidth={1.5} />} label={tProperty('bathrooms')} value={`${property.bathrooms}`} />
          <SpecCell icon={<Maximize className="h-4 w-4" strokeWidth={1.5} />} label={tProperty('area')} value={tProperty('areaLabel', { n: property.areaSqm })} />
          {property.floor && (
            <SpecCell icon={<Building2 className="h-4 w-4" strokeWidth={1.5} />} label={tProperty('floor')} value={`${property.floor}/${property.totalFloors ?? property.floor}`} />
          )}
          <SpecCell icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />} label={tProperty('year')} value={`${property.yearBuilt}`} />
          <SpecCell
            icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.5} />}
            label={tCatalog('ownership')}
            value={
              property.ownership === 'leasehold' && property.leaseYearsRemaining
                ? `${tOwnership('leasehold')} (${property.leaseYearsRemaining}y)`
                : tOwnership(property.ownership)
            }
          />
        </div>
      </section>

      {/* Main grid: description + sticky sidebar (form) */}
      <section className="mx-auto mt-20 max-w-[1280px] px-6 sm:mt-24 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {/* Description column */}
          <div>
            <Eyebrow className="mb-6">{t('aboutEyebrow')}</Eyebrow>
            <h2 className="mb-6 font-serif text-3xl font-normal text-teak-deep sm:text-4xl">{t('aboutTitle')}</h2>
            <p className="text-[17px] leading-[1.7] text-teak-warm">{property.description[locale]}</p>

            {property.view && (
              <div className="mt-8 flex items-start gap-3 border-l-2 border-gold-deep pl-5 text-base text-teak-warm">
                <Eye className="mt-1 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.5} />
                <span>{property.view[locale]}</span>
              </div>
            )}

            {property.tags.length > 0 && (
              <div className="mt-12">
                <Eyebrow className="mb-5">{t('highlightsEyebrow')}</Eyebrow>
                <div className="flex flex-wrap gap-2">
                  {property.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--line-strong)] bg-paper px-4 py-2 text-sm tracking-tight text-teak"
                    >
                      {tTags(tag)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.amenities.length > 0 && (
              <div className="mt-14">
                <Eyebrow className="mb-5">{t('amenitiesEyebrow')}</Eyebrow>
                <h3 className="mb-6 font-serif text-2xl font-normal text-teak-deep">{t('amenitiesTitle')}</h3>
                <ul className="grid grid-cols-1 gap-y-3 gap-x-6 text-sm text-teak-warm sm:grid-cols-2">
                  {property.amenities.map((a: Amenity) => (
                    <li key={a} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-gold-deep" />
                      {tAmenities(a)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sticky contact form */}
          <aside className="lg:sticky lg:top-28 lg:h-min">
            <ContactForm property={property} />
          </aside>
        </div>
      </section>

      {/* Map */}
      {property.coordinates && (
        <section className="mx-auto mt-24 max-w-[1280px] px-6 sm:mt-32 sm:px-10 lg:px-14">
          <Eyebrow className="mb-6">{t('mapEyebrow')}</Eyebrow>
          <h2 className="mb-8 font-serif text-3xl font-normal text-teak-deep sm:text-4xl">
            {t('mapTitle')}
          </h2>
          <div className="overflow-hidden rounded-xl border border-[var(--line)] shadow-[0_8px_32px_rgba(43,24,16,0.08)]" style={{ height: '420px' }}>
            <PropertyMapClient
              lat={property.coordinates.lat}
              lng={property.coordinates.lng}
              label={property.name[locale]}
            />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
            {property.address[locale]}
          </p>
        </section>
      )}

      {/* ROI calculator */}
      <section className="mx-auto mt-24 max-w-[1280px] px-6 sm:mt-32 sm:px-10 lg:px-14">
        <Eyebrow className="mb-6">{t('roiEyebrow')}</Eyebrow>
        <h2 className="mb-12 font-serif text-3xl font-normal leading-tight text-teak-deep sm:text-5xl">
          {t('roiTitle')}
        </h2>
        <RoiCalculator property={property} />
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto mt-32 max-w-[1280px] px-6 pb-32 sm:px-10 sm:pb-40 lg:px-14">
          <Eyebrow className="mb-6">{t('relatedEyebrow')}</Eyebrow>
          <h2 className="mb-12 font-serif text-3xl font-normal text-teak-deep sm:text-5xl">
            {t('relatedTitle')}
          </h2>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function SpecCell({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 bg-paper p-5">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-serif text-xl font-normal text-teak-deep">{value}</div>
    </div>
  );
}
