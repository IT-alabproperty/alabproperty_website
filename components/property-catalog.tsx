'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LayoutGrid, List, SlidersHorizontal, X, Search } from 'lucide-react';
import {
  sortProperties,
  type PropertyFilters,
  type SortKey,
} from '@/lib/property-utils';
import type { Locale, Property, PropertyType, District, OwnershipType, PropertyDeal, City } from '@/lib/types';
import { useCurrency } from './currency-context';
import { formatPrice } from '@/lib/currency';
import { PropertyCard } from './property-card';

// Dynamic taxonomies — passed in as props from the server component.
interface TaxonomyRow { slug: string; name: { ru: string; en: string } }
interface DistrictRow extends TaxonomyRow { city_slug: string | null }

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const PRICE_POINTS = [3_000_000, 5_000_000, 10_000_000, 15_000_000, 25_000_000, 40_000_000, 60_000_000, 100_000_000];

interface InternalFilters extends PropertyFilters {
  deal?: PropertyDeal;
  city?: City;
}

export function PropertyCatalog({
  initialProperties,
  cities = [],
  types = [],
  districts = [],
}: {
  initialProperties: Property[];
  cities?: TaxonomyRow[];
  types?: TaxonomyRow[];
  districts?: DistrictRow[];
}) {
  const t = useTranslations('Catalog');
  const tType = useTranslations('PropertyType');
  const tDistrict = useTranslations('District');
  const tOwnership = useTranslations('Ownership');
  const tCity = useTranslations('City');
  const { currency } = useCurrency();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();

  // Helper: resolve display label for a taxonomy row in the current locale, fall back to slug.
  const cityLabel = (slug: string) => {
    const row = cities.find((c) => c.slug === slug);
    if (row) return row.name?.[locale] ?? row.name?.ru ?? slug;
    // Fall back to translation key for legacy seeded slugs
    try { return tCity(slug); } catch { return slug; }
  };
  const typeLabel = (slug: string) => {
    const row = types.find((c) => c.slug === slug);
    if (row) return row.name?.[locale] ?? row.name?.ru ?? slug;
    try { return tType(slug); } catch { return slug; }
  };
  const districtLabel = (slug: string) => {
    const row = districts.find((c) => c.slug === slug);
    if (row) return row.name?.[locale] ?? row.name?.ru ?? slug;
    try { return tDistrict(slug); } catch { return slug; }
  };

  const [filters, setFilters] = useState<InternalFilters>({});
  const [codeQuery, setCodeQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [panelOpen, setPanelOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Сидируем фильтры из URL (?code=, ?type=, ?city= и т.д.) один раз при монтировании
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) { setCodeQuery(code.toUpperCase()); return; }
    const next: InternalFilters = {};
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const bedrooms = searchParams.get('bedrooms');
    const priceFrom = searchParams.get('priceFrom');
    const priceTo = searchParams.get('priceTo');
    if (type) next.type = type as PropertyType;
    if (city) next.city = city as City;
    if (district) next.district = district as District;
    if (bedrooms) next.bedrooms = +bedrooms;
    if (priceFrom) next.minPriceThb = +priceFrom;
    if (priceTo) next.maxPriceThb = +priceTo;
    if (Object.keys(next).length) setFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active count for the "more filters" badge
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.type) n++;
    if (filters.district) n++;
    if (filters.bedrooms) n++;
    if (filters.minPriceThb !== undefined || filters.maxPriceThb !== undefined) n++;
    if (filters.ownership) n++;
    if (filters.deal) n++;
    if (filters.city) n++;
    return n;
  }, [filters]);

  const results = useMemo(() => {
    const filtered = initialProperties.filter((p) => {
      if (codeQuery && p.code?.toUpperCase() !== codeQuery) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.district && p.district !== filters.district) return false;
      if (filters.minPriceThb !== undefined && p.priceThb < filters.minPriceThb) return false;
      if (filters.maxPriceThb !== undefined && p.priceThb > filters.maxPriceThb) return false;
      if (filters.bedrooms !== undefined && p.bedrooms < filters.bedrooms) return false;
      if (filters.ownership && p.ownership !== filters.ownership) return false;
      if (filters.city) {
        if (!(p.city === filters.city || (!p.city && filters.city === 'bangkok'))) return false;
      }
      if ((filters as InternalFilters).deal && p.deal !== (filters as InternalFilters).deal) return false;
      return true;
    });
    return sortProperties(filtered, sortKey);
  }, [filters, sortKey, initialProperties, codeQuery]);

  // сбрасываем видимые при смене фильтров/сортировки
  useEffect(() => { setVisibleCount(30); }, [filters, sortKey]);

  // IntersectionObserver — когда sentinel виден, показываем ещё 30
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((n) => n + 30);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const reset = () => { setFilters({}); setCodeQuery(''); };

  return (
    <div>
      {/* Compact filter bar */}
      <div className="sticky top-[60px] z-40 -mx-6 mb-12 border-y border-[var(--line)] bg-paper/92 px-6 py-4 backdrop-blur-md sm:-mx-10 sm:px-10 lg:-mx-14 lg:px-14">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          {/* Quick filters: chips — desktop only */}
          <div className="hidden sm:contents">
            <ChipSelect
              label={t('filterPanel.type')}
              value={filters.type}
              onChange={(v) => setFilters((f) => ({ ...f, type: v as PropertyType | undefined }))}
              options={types.map((row) => ({ value: row.slug, label: typeLabel(row.slug) }))}
              anyLabel={t('filterPanel.anyOption')}
            />
            <ChipSelect
              label={t('filterPanel.city')}
              value={filters.city}
              onChange={(v) => setFilters((f) => ({ ...f, city: v as City | undefined }))}
              options={cities.map((row) => ({ value: row.slug, label: cityLabel(row.slug) }))}
              anyLabel={t('filterPanel.cityAny')}
            />
            <ChipSelect
              label={t('filterPanel.district')}
              value={filters.district}
              onChange={(v) => setFilters((f) => ({ ...f, district: v as District | undefined }))}
              options={districts
                .filter((row) => !filters.city || !row.city_slug || row.city_slug === filters.city)
                .map((row) => ({ value: row.slug, label: districtLabel(row.slug) }))}
              anyLabel={t('filterPanel.anyOption')}
            />
            <ChipSelect
              label={t('filterPanel.bedrooms')}
              value={filters.bedrooms?.toString()}
              onChange={(v) => setFilters((f) => ({ ...f, bedrooms: v ? +v : undefined }))}
              options={BEDROOM_OPTIONS.map((n) => ({ value: n.toString(), label: `${n}+` }))}
              anyLabel={t('filterPanel.bedroomsAny')}
            />
          </div>

          {/* More filters button */}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-paper px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-teak transition-colors hover:border-gold-deep hover:text-gold-deep sm:ml-auto"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{t('moreFilters')}</span>
            {activeCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-semibold text-teak-deep">
                {activeCount}
              </span>
            )}
          </button>

          {/* Active filter count badge — mobile only summary */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="flex items-center gap-1.5 rounded-full border border-gold-deep bg-paper px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-gold-deep transition-colors hover:bg-cream-warm sm:hidden"
            >
              <X className="h-3 w-3" strokeWidth={2} />
              <span>{activeCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: count, sort, view toggle */}
      <div className="mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 max-w-[1280px]">
        <div className="text-sm text-muted">
          {t('resultCount', { count: results.length })}
        </div>
        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-[var(--line-strong)] bg-paper px-3 py-2 text-xs uppercase tracking-[0.1em] text-teak outline-none transition-colors focus:border-gold-deep"
          >
            <option value="recommended">{t('sort.newest')}</option>
            <option value="newest">{t('sort.newest')}</option>
            <option value="price-asc">{t('sort.priceAsc')}</option>
            <option value="price-desc">{t('sort.priceDesc')}</option>
            <option value="area-desc">{t('sort.areaDesc')}</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-md border border-[var(--line-strong)] bg-paper p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              data-active={view === 'grid'}
              aria-label={t('viewGrid')}
              className="alab-view-btn flex h-7 w-8 items-center justify-center rounded transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              data-active={view === 'list'}
              aria-label={t('viewList')}
              className="alab-view-btn flex h-7 w-8 items-center justify-center rounded transition-colors"
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="mx-auto max-w-[1280px] py-24 text-center">
          <h3 className="font-serif text-3xl font-normal text-teak-deep">{t('emptyTitle')}</h3>
          <p className="mt-3 text-muted">{t('emptyDesc')}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-full bg-teak-deep px-8 py-3 text-xs font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-gold-deep"
          >
            {t('emptyReset')}
          </button>
        </div>
      ) : (
        <>
          <div
            className={
              view === 'grid'
                ? 'mx-auto grid max-w-[1280px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'mx-auto flex max-w-[1280px] flex-col gap-8'
            }
          >
            {results.slice(0, visibleCount).map((p) => (
              <PropertyCard key={p.id} property={p} mode={view} />
            ))}
          </div>

          {/* sentinel — триггер для подгрузки следующих 30 */}
          {visibleCount < results.length ? (
            <div ref={sentinelRef} className="mt-20 flex justify-center">
              <div className="h-1 w-1" aria-hidden />
            </div>
          ) : (
            <div className="mt-20 text-center text-xs uppercase tracking-[0.18em] text-muted">
              {t('endOfResults')}
            </div>
          )}
        </>
      )}

      {/* Slide-over filter panel */}
      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onReset={reset}
        cities={cities}
        types={types}
        districts={districts}
        cityLabel={cityLabel}
        typeLabel={typeLabel}
        districtLabel={districtLabel}
      />

      <style>{`
        .alab-view-btn { color: var(--muted); }
        .alab-view-btn:hover { color: var(--teak); }
        .alab-view-btn[data-active='true'] {
          background: var(--teak);
          color: var(--cream);
        }
      `}</style>
    </div>
  );
}

// ============================================================
// CHIP SELECT - inline filter chip with dropdown
// ============================================================

interface ChipOption { value: string; label: string }

function ChipSelect({
  label, value, options, onChange, anyLabel,
}: {
  label: string;
  value?: string;
  options: ChipOption[];
  onChange: (v: string | undefined) => void;
  anyLabel: string;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="appearance-none rounded-full border bg-paper px-4 py-2 pr-9 text-xs font-medium uppercase tracking-[0.1em] outline-none transition-colors"
        style={{
          borderColor: selected ? 'var(--gold-deep)' : 'var(--line-strong)',
          color: selected ? 'var(--teak-deep)' : 'var(--muted)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238C7A6B' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
        }}
      >
        <option value="">{label}: {anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{label}: {o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============================================================
// FILTER PANEL - slide-over from the right
// ============================================================

function FilterPanel({
  open, onClose, filters, setFilters, onReset,
  cities, types, districts, cityLabel, typeLabel, districtLabel,
}: {
  open: boolean;
  onClose: () => void;
  filters: InternalFilters;
  setFilters: React.Dispatch<React.SetStateAction<InternalFilters>>;
  onReset: () => void;
  cities: TaxonomyRow[];
  types: TaxonomyRow[];
  districts: DistrictRow[];
  cityLabel: (slug: string) => string;
  typeLabel: (slug: string) => string;
  districtLabel: (slug: string) => string;
}) {
  const t = useTranslations('Catalog');
  const tOwnership = useTranslations('Ownership');
  const { currency } = useCurrency();
  const visibleDistricts = filters.city
    ? districts.filter((d) => !d.city_slug || d.city_slug === filters.city)
    : districts;

  return (
    <>
      <div
        data-open={open}
        onClick={onClose}
        className="alab-filter-backdrop fixed inset-0 z-[150] bg-ink/50 backdrop-blur-sm"
      />
      <aside
        data-open={open}
        className="alab-filter-panel fixed right-0 top-0 z-[151] flex h-full w-full max-w-[480px] flex-col bg-paper shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-8 py-6">
          <h3 className="font-serif text-2xl font-normal text-teak-deep">{t('filters')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-teak transition-colors hover:bg-cream-warm"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">


          {/* Type */}
          <FilterGroup label={t('filterPanel.type')}>
            <div className="flex flex-wrap gap-2">
              {types.map((row) => (
                <PillButton
                  key={row.slug}
                  active={filters.type === row.slug}
                  onClick={() =>
                    setFilters((f) => ({ ...f, type: f.type === row.slug ? undefined : row.slug }))
                  }
                >
                  {typeLabel(row.slug)}
                </PillButton>
              ))}
            </div>
          </FilterGroup>

          {/* City */}
          <FilterGroup label={t('filterPanel.city')}>
            <div className="flex flex-wrap gap-2">
              {cities.map((row) => (
                <PillButton
                  key={row.slug}
                  active={filters.city === row.slug}
                  onClick={() =>
                    setFilters((f) => ({ ...f, city: f.city === row.slug ? undefined : row.slug }))
                  }
                >
                  {cityLabel(row.slug)}
                </PillButton>
              ))}
            </div>
          </FilterGroup>

          {/* District */}
          <FilterGroup label={t('filterPanel.district')}>
            <div className="flex flex-wrap gap-2">
              {visibleDistricts.map((row) => (
                <PillButton
                  key={row.slug}
                  active={filters.district === row.slug}
                  onClick={() =>
                    setFilters((f) => ({ ...f, district: f.district === row.slug ? undefined : row.slug }))
                  }
                >
                  {districtLabel(row.slug)}
                </PillButton>
              ))}
            </div>
          </FilterGroup>

          {/* Bedrooms */}
          <FilterGroup label={t('filterPanel.bedrooms')}>
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((n) => (
                <PillButton
                  key={n}
                  active={filters.bedrooms === n}
                  onClick={() =>
                    setFilters((f) => ({ ...f, bedrooms: f.bedrooms === n ? undefined : n }))
                  }
                >
                  {n}+
                </PillButton>
              ))}
            </div>
          </FilterGroup>

          {/* Price */}
          <FilterGroup label={t('priceRange')}>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.minPriceThb ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minPriceThb: e.target.value ? +e.target.value : undefined }))
                }
                className="alab-filter-select"
              >
                <option value="">{t('filterPanel.anyOption')}</option>
                {PRICE_POINTS.map((p) => (
                  <option key={p} value={p}>{formatPrice(p, currency)}</option>
                ))}
              </select>
              <select
                value={filters.maxPriceThb ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, maxPriceThb: e.target.value ? +e.target.value : undefined }))
                }
                className="alab-filter-select"
              >
                <option value="">{t('filterPanel.anyOption')}</option>
                {PRICE_POINTS.map((p) => (
                  <option key={p} value={p}>{formatPrice(p, currency)}</option>
                ))}
              </select>
            </div>
          </FilterGroup>

          {/* Ownership */}
          <FilterGroup label={t('ownership')}>
            <div className="flex gap-2">
              {(['freehold', 'leasehold'] as const).map((v) => (
                <PillButton
                  key={v}
                  active={filters.ownership === v}
                  onClick={() =>
                    setFilters((f) => ({ ...f, ownership: f.ownership === v ? undefined : v }))
                  }
                >
                  {tOwnership(v)}
                </PillButton>
              ))}
            </div>
          </FilterGroup>

          
        </div>

        <div className="flex gap-3 border-t border-[var(--line)] bg-cream-warm/50 px-8 py-5">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-xs font-medium uppercase tracking-[0.14em] text-teak transition-colors hover:bg-cream-warm"
          >
            {t('emptyReset')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-teak-deep px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-gold-deep"
          >
            {t('apply')}
          </button>
        </div>
      </aside>

      <style>{`
        .alab-filter-backdrop {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .alab-filter-backdrop[data-open='true'] {
          opacity: 1;
          pointer-events: auto;
        }
        .alab-filter-panel {
          transform: translateX(100%);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .alab-filter-panel[data-open='true'] {
          transform: translateX(0);
        }
        .alab-filter-select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--line-strong);
          border-radius: 6px;
          background: white;
          font-family: inherit;
          font-size: 13px;
          color: var(--teak);
          outline: none;
        }
        .alab-filter-select:focus { border-color: var(--gold-deep); }
      `}</style>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">{label}</div>
      {children}
    </div>
  );
}

function PillButton({
  children, active, onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-medium tracking-tight transition-colors ${
        active
          ? 'border-teak-deep bg-teak-deep text-cream'
          : 'border-[var(--line-strong)] bg-paper text-teak hover:border-teak-deep'
      }`}
    >
      {children}
    </button>
  );
}
