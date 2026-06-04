import type { Metadata } from 'next';
import { Link } from '@/lib/i18n/routing';
import { notFound } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  ArrowLeft, BedDouble, Bath, Maximize, Building2, Calendar,
  ShieldCheck, Eye, MapPin,
} from 'lucide-react';
import { getPropertyBySlug, getRelatedProperties, getAllProperties } from '@/lib/db/properties';
import { getDistricts, getPropertyTypes, getCities, getAmenities, getTags } from '@/lib/db/taxonomy';
import { PropertyGallery } from '@/components/property/property-gallery';
import { RoiCalculator } from '@/components/property/roi-calculator';
import { ContactForm } from '@/components/property/contact-form';
import { PropertyMapClient } from '@/components/property/property-map-client';
import { PropertyCard } from '@/components/property-card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { PriceDisplay } from '@/components/property/price-display';
import { ProposalButton } from '@/components/proposal-button';
import { ViewTracker } from '@/components/property/view-tracker';
import { buildMetadata, SITE_URL, truncate, buildBreadcrumbsLd } from '@/lib/seo';
import type { Locale, Property, Amenity } from '@/lib/types';

/** "phrom-phong" → "Phrom Phong" — fallback when a slug isn't in any taxonomy row. */
function prettifySlug(slug: string): string {
  return slug
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface TaxRow { slug: string; name: { ru: string; en: string } }
function resolveLabel(rows: TaxRow[], slug: string | null | undefined, locale: Locale): string {
  if (!slug) return '—';
  const row = rows.find((r) => r.slug === slug);
  if (row) return row.name?.[locale] ?? row.name?.ru ?? prettifySlug(slug);
  return prettifySlug(slug);
}

/**
 * Shorten a verbose Google-Maps-style Thai address to its useful parts for
 * the listing header. Strips parts the page already shows (city/country)
 * or that just add noise (postal codes, "Khwaeng"/"Khet" prefixes, the
 * "Krung Thep Maha Nakhon" formal Bangkok name, duplicate "Thailand"
 * tokens that creep in when the editor pastes a fully-qualified address).
 *
 * Example in → out:
 *   "195 Ratchawithi 21 Alley, Khwaeng Bang Yi Khan, Khet Bang Phlat,
 *    Krung Thep Maha Nakhon 10700, Thailand, Thailand"
 *   → "195 Ratchawithi 21 Alley, Bang Yi Khan"
 */
function shortenAddress(raw: string | undefined | null): string {
  if (!raw) return '';
  const seen = new Set<string>();
  const parts = raw
    .split(',')
    .map((p) => p
      .replace(/\b\d{5}\b/g, '') // postcodes
      .replace(/\bKhwaeng\s+/gi, '')
      .replace(/\bKhet\s+/gi, '')
      .replace(/\bKrung\s+Thep(?:\s+Maha\s+Nakhon)?\b/gi, '')
      .replace(/\bThailand\b/gi, '')
      .replace(/\bBangkok\b/gi, '')
      .trim()
    )
    .filter((p) => {
      if (!p || p.length < 2) return false;
      // De-duplicate (handles the "Thailand, Thailand" double-paste case).
      const key = p.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  // Two parts is plenty for the header — street/unit + locality.
  return parts.slice(0, 2).join(', ');
}

// Regenerate listing pages on demand (and at least every hour) instead of
// rebuilding on every request. Means Google sees fresh data without the cold
// hit on first visit.
export const revalidate = 3600

export async function generateStaticParams() {
  const properties = await getAllProperties();
  return properties.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const property = await getPropertyBySlug(slug);
  if (!property) {
    const t = await getTranslations({ locale, namespace: 'SEO' });
    return buildMetadata({
      locale,
      title: t('defaultTitle'),
      description: t('defaultDescription'),
      path: `/properties/${slug}`,
      noindex: true,
    });
  }
  const name = property.name[locale] || property.name.ru;
  // Meta description = key specs upfront (price, bedrooms, area, district)
  // + a teaser from the long description. This is what Google shows in the
  // result snippet — packing specs gives users an at-a-glance value prop.
  const specsParts: string[] = [];
  if (property.bedrooms) {
    specsParts.push(locale === 'ru' ? `${property.bedrooms}-комн.` : `${property.bedrooms}-bed`);
  }
  if (property.areaSqm) specsParts.push(`${property.areaSqm} m²`);
  if (property.priceThb) {
    const millions = property.priceThb >= 1_000_000 ? `฿${Math.round(property.priceThb / 100_000) / 10}M` : `฿${property.priceThb}`;
    specsParts.push(locale === 'ru' ? `от ${millions}` : `from ${millions}`);
  }
  const localityForMeta = property.address?.[locale] || property.address?.ru;
  if (localityForMeta) specsParts.push(localityForMeta);
  const specsLine = specsParts.join(' · ');
  const longText = property.description[locale] || property.description.ru || '';
  const description = truncate(
    [specsLine, longText].filter(Boolean).join(' — '),
    160,
  );
  return buildMetadata({
    locale,
    title: name,
    description,
    path: `/properties/${property.slug}`,
    image: property.coverImage || property.gallery?.[0],
    imageAlt: name,
    ogType: 'article',
  });
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const [property, related, districts, types, cities, amenities, tags] = await Promise.all([
    getPropertyBySlug(slug),
    getRelatedProperties(slug, 3),
    getDistricts(),
    getPropertyTypes(),
    getCities(),
    getAmenities(),
    getTags(),
  ]);
  if (!property) notFound();

  // RealEstateListing JSON-LD. Numbers get coerced where Schema.org expects
  // strings; missing values are simply omitted rather than defaulted.
  const cityRow = property.city ? cities.find((c) => c.slug === property.city) : null;
  const localityName = cityRow?.name?.[locale] ?? cityRow?.name?.ru ?? undefined;
  const propertyName = property.name[locale] || property.name.ru;
  const propertyDescription = truncate(
    property.description[locale] || property.description.ru || '',
    320,
  );
  const listingLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: propertyName,
    url: `${SITE_URL}/properties/${property.slug}`,
    description: propertyDescription || undefined,
    image: property.coverImage || property.gallery?.[0] || undefined,
    numberOfRooms: property.bedrooms || undefined,
    numberOfBedrooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    floorSize: property.areaSqm
      ? { '@type': 'QuantitativeValue', value: property.areaSqm, unitCode: 'MTK' }
      : undefined,
    yearBuilt: property.yearBuilt || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address?.[locale] || property.address?.ru || undefined,
      addressLocality: localityName,
      addressCountry: 'TH',
    },
    geo: property.coordinates
      ? {
          '@type': 'GeoCoordinates',
          latitude: property.coordinates.lat,
          longitude: property.coordinates.lng,
        }
      : undefined,
    // Offer: price + validity. priceValidUntil = a year out (THB-denominated
    // listings typically hold price for months; Google requires a date).
    offers: {
      '@type': 'Offer',
      price: property.priceThb,
      priceCurrency: 'THB',
      availability:
        property.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/properties/${property.slug}`,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    },
    // Gallery as additional images — gives Google something to show in the
    // image-rich result row.
    ...(property.gallery && property.gallery.length > 0
      ? { photo: property.gallery.slice(0, 8).map((url) => ({ '@type': 'ImageObject', url })) }
      : {}),
  };

  // Breadcrumb trail for Google rich results: Home › Properties › {Name}
  const breadcrumbLd = buildBreadcrumbsLd([
    { name: locale === 'ru' ? 'Главная' : 'Home', path: '/' },
    { name: locale === 'ru' ? 'Объекты' : 'Properties', path: '/properties' },
    { name: propertyName, path: `/properties/${property.slug}` },
  ]);

  return (
    <>
      {/* Plain <script> — next/script packs inline JSON into the RSC payload
          instead of rendering an actual <script> tag in HTML, so Googlebot's
          Rich Results Test reports "no items detected". A vanilla script tag
          in a server component renders directly into the initial HTML. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ViewTracker slug={property.slug} />
      <PropertyContent
        property={property}
        related={related}
        districts={districts}
        types={types}
        cities={cities}
        amenities={amenities}
        tags={tags}
      />
    </>
  );
}

function PropertyContent({
  property, related, districts, types, cities, amenities, tags,
}: {
  property: Property;
  related: Property[];
  districts: TaxRow[];
  types: TaxRow[];
  cities: TaxRow[];
  amenities: TaxRow[];
  tags: TaxRow[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('PropertyPage');
  const tCatalog = useTranslations('Catalog');
  const tDeal = useTranslations('Deal');
  const tProperty = useTranslations('Property');
  const tOwnership = useTranslations('Ownership');
  const tTags = useTranslations('Tags');
  const tAmenities = useTranslations('Amenities');

  const districtLabel = resolveLabel(districts, property.district, locale);
  const typeLabel = resolveLabel(types, property.type, locale);
  // City label for the location line under the property title. Falls back to
  // RU name if the current locale's label isn't filled in, and to undefined
  // (rather than the raw slug) if the city is missing entirely — that way
  // the JSX below can collapse the row gracefully.
  const cityRow = property.city ? cities.find((c) => c.slug === property.city) : null;
  const localityName: string | undefined =
    cityRow?.name?.[locale] ?? cityRow?.name?.ru ?? undefined;

  // DB-first label resolution: row.name → i18n fallback → prettified slug.
  // Lets admin-created custom amenities/tags render correctly while keeping
  // existing seed slugs working via the i18n namespaces.
  const resolveAmenityLabel = (slug: string): string => {
    const row = amenities.find((r) => r.slug === slug);
    if (row) return row.name?.[locale] ?? row.name?.ru ?? prettifySlug(slug);
    try { return tAmenities(slug); } catch { return prettifySlug(slug); }
  };
  const resolveTagLabel = (slug: string): string => {
    const row = tags.find((r) => r.slug === slug);
    if (row) return row.name?.[locale] ?? row.name?.ru ?? prettifySlug(slug);
    try { return tTags(slug); } catch { return prettifySlug(slug); }
  };
  const ownershipLabel = (() => {
    try { return property.ownership ? tOwnership(property.ownership) : '—'; }
    catch { return property.ownership ?? '—'; }
  })();

  return (
    <main className="min-h-screen bg-paper pt-28 sm:pt-32">
      {/* Breadcrumb trail — semantic <nav> + visible chevron crumbs.
          Matches the BreadcrumbList JSON-LD emitted in the page <head> so
          screen readers, sighted users and Google all see the same path. */}
      <nav
        aria-label={locale === 'ru' ? 'Хлебные крошки' : 'Breadcrumb'}
        className="mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-14"
      >
        <ol className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">
          <li>
            <Link href="/" className="transition-colors hover:text-gold-deep">
              {locale === 'ru' ? 'Главная' : 'Home'}
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted/50">/</li>
          <li>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gold-deep"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={1.75} />
              {t('backToCatalog')}
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted/50">/</li>
          <li aria-current="page" className="max-w-[60vw] truncate text-teak/70">
            {property.name[locale]}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mx-auto mt-8 max-w-[1280px] px-6 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3" strokeWidth={2} />
                {districtLabel}
              </span>
              <span>·</span>
              <span>{typeLabel}</span>
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
            {/*
              Location line: "City · Address". Both parts are optional —
              older properties may have address but no city set, or city
              taxonomy may not have been added yet.
              We shorten the address to its useful parts (street + locality)
              so the heading stays compact even when the editor pasted a
              full Google-Maps-style address with country/postcode/etc.
            */}
            {(() => {
              const shortAddr = shortenAddress(property.address?.[locale] || property.address?.ru);
              const parts = [localityName, shortAddr].filter((p) => p && String(p).trim());
              if (parts.length === 0) return null;
              return (
                <p className="mt-3 text-base leading-snug text-muted sm:text-lg">
                  {parts.join(' · ')}
                </p>
              );
            })()}
            {property.code && (
              <p className="mt-2 font-mono text-[11px] tracking-[0.25em] text-muted/55">
                {property.code}
              </p>
            )}
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
                ? `${ownershipLabel} (${property.leaseYearsRemaining}y)`
                : ownershipLabel
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
                      {resolveTagLabel(tag)}
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
                      {resolveAmenityLabel(a)}
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

      {/*
        Map. We prefer feeding the embed an address string over raw lat/lng
        because Google's server-side geocode is street-accurate, whereas
        any coords we stored (legacy data from when we used Nominatim) may
        only be at district-centroid resolution.

        We pass the ORIGINAL full address to the geocoder (not the shortened
        one used in the heading) — Google can use the extra disambiguation
        even though it's noise for human readers. We just guard against the
        common "Thailand, Thailand, Thailand" duplication.
      */}
      {(() => {
        const rawAddress = property.address?.[locale] || property.address?.ru;
        const hasMappable = !!(rawAddress || property.coordinates);
        if (!hasMappable) return null;
        // Strip duplicated trailing "Thailand"s before sending to Google.
        // We append our own ", Thailand" so the country is always exactly once.
        const cleanedAddress = (rawAddress || '')
          .replace(/(?:,\s*Thailand)+\s*$/gi, '')
          .trim();
        const query = [cleanedAddress, localityName, 'Thailand']
          .filter((p) => p && String(p).trim())
          .join(', ');
        return (
          <section className="mx-auto mt-24 max-w-[1280px] px-6 sm:mt-32 sm:px-10 lg:px-14">
            <Eyebrow className="mb-6">{t('mapEyebrow')}</Eyebrow>
            <h2 className="mb-8 font-serif text-3xl font-normal text-teak-deep sm:text-4xl">
              {t('mapTitle')}
            </h2>
            <div className="overflow-hidden rounded-xl border border-[var(--line)] shadow-[0_8px_32px_rgba(43,24,16,0.08)]" style={{ height: '420px' }}>
              <PropertyMapClient
                query={query}
                lat={property.coordinates?.lat}
                lng={property.coordinates?.lng}
                label={property.name[locale]}
              />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">
              {shortenAddress(rawAddress) || rawAddress}
            </p>
          </section>
        );
      })()}

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
