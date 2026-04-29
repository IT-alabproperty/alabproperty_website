'use client';

import { useState } from 'react';
import { ChevronDown, Filter, Grid2x2, List, X, Search as SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrency } from './currency-context';
import { formatPrice } from '@/lib/currency';
import type { Property } from '@/lib/types';

export type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'areaDesc';
export type ViewMode = 'grid' | 'list';

export interface CatalogFilters {
  deal: 'sale' | 'rent';
  type: Property['type'] | '';
  district: Property['district'] | '';
  bedrooms: number | '';
  priceFrom: number | '';
  priceTo: number | '';
  ownership: Property['ownership'] | '';
  amenities: Property['amenities'];
  tags: Property['tags'];
}

export const initialFilters: CatalogFilters = {
  deal: 'sale',
  type: '',
  district: '',
  bedrooms: '',
  priceFrom: '',
  priceTo: '',
  ownership: '',
  amenities: [],
  tags: [],
};

const types: Property['type'][] = ['condo', 'villa', 'townhouse', 'penthouse', 'land'];
const districts: Property['district'][] = ['sukhumvit', 'silom', 'sathorn', 'thonglor', 'phrom-phong', 'asok', 'riverside', 'ari'];
const bedroomOptions = [1, 2, 3, 4, 5];
const pricePoints = [3_000_000, 5_000_000, 10_000_000, 15_000_000, 25_000_000, 40_000_000, 60_000_000, 100_000_000];
const allAmenities: Property['amenities'] = ['pool', 'gym', 'sauna', 'parking', 'security', 'concierge', 'co-working', 'garden', 'rooftop', 'kids-area', 'pet-friendly'];
const allTags: Property['tags'] = ['sea-view', 'city-view', 'river-view', 'new-build', 'fully-furnished', 'pool-access', 'high-floor', 'investor-pick'];

interface CatalogToolbarProps {
  filters: CatalogFilters;
  onFiltersChange: (f: CatalogFilters) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  resultCount: number;
}

export function CatalogToolbar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
}: CatalogToolbarProps) {
  const t = useTranslations('Catalog');
  const tSearch = useTranslations('Search');
  const tType = useTranslations('PropertyType');
  const tDistrict = useTranslations('District');
  const tOwnership = useTranslations('Ownership');
  const tAmenities = useTranslations('Amenities');
  const tTags = useTranslations('Tags');
  const { currency } = useCurrency();

  const [panelOpen, setPanelOpen] = useState(false);

  const update = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const reset = () => onFiltersChange(initialFilters);

  // Count active filters (excluding deal which is always set)
  const activeCount =
    (filters.type ? 1 : 0) +
    (filters.district ? 1 : 0) +
    (filters.bedrooms ? 1 : 0) +
    (filters.priceFrom ? 1 : 0) +
    (filters.priceTo ? 1 : 0) +
    (filters.ownership ? 1 : 0) +
    filters.amenities.length +
    filters.tags.length;

  return (
    <>
      {/* Sticky toolbar */}
      <div className="sticky top-[68px] z-40 -mx-6 mb-10 border-b border-[var(--line)] bg-paper/96 px-6 py-4 backdrop-blur-md sm:-mx-10 sm:px-10 sm:py-5 lg:-mx-14 lg:px-14">
        <div className="mx-auto max-w-[1400px]">
          {/* Row 1: deal tabs + result count + view toggle + sort */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Deal tabs */}
            <div className="flex rounded-full border border-[var(--line-strong)] p-1">
              {(['sale', 'rent'] as const).map((d) => {
                const active = filters.deal === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => update('deal', d)}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
                      active ? 'bg-teak-deep text-cream' : 'text-muted hover:text-teak'
                    }`}
                  >
                    {tSearch(d === 'sale' ? 'forSale' : 'forRent')}
                  </button>
                );
              })}
            </div>

            <span className="hidden text-xs text-muted sm:inline">
              {t('resultCount', { count: resultCount })}
            </span>

            <div className="ml-auto flex items-center gap-2">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => onSortChange(e.target.value as SortKey)}
                  className="appearance-none rounded-md border border-[var(--line-strong)] bg-transparent px-4 py-2 pr-9 text-xs uppercase tracking-[0.12em] text-teak focus:border-gold-deep focus:outline-none"
                >
                  <option value="newest">{t('sort.newest')}</option>
                  <option value="priceAsc">{t('sort.priceAsc')}</option>
                  <option value="priceDesc">{t('sort.priceDesc')}</option>
                  <option value="areaDesc">{t('sort.areaDesc')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" strokeWidth={1.75} />
              </div>

              {/* View toggle */}
              <div className="hidden rounded-md border border-[var(--line-strong)] sm:flex">
                <button
                  type="button"
                  onClick={() => onViewChange('grid')}
                  aria-label={t('viewGrid')}
                  className={`flex h-9 w-9 items-center justify-center rounded-l-md transition-colors duration-200 ${
                    view === 'grid' ? 'bg-teak-deep text-cream' : 'text-muted hover:text-teak'
                  }`}
                >
                  <Grid2x2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange('list')}
                  aria-label={t('viewList')}
                  className={`flex h-9 w-9 items-center justify-center rounded-r-md transition-colors duration-200 ${
                    view === 'list' ? 'bg-teak-deep text-cream' : 'text-muted hover:text-teak'
                  }`}
                >
                  <List className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>

              {/* More filters */}
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--line-strong)] px-4 py-2 text-xs uppercase tracking-[0.12em] text-teak transition-colors duration-200 hover:bg-teak-deep hover:text-cream"
              >
                <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{t('moreFilters')}</span>
                {activeCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold-deep px-1.5 text-[10px] font-semibold text-cream">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Quick filters - hidden on mobile */}
          <div className="mt-4 hidden flex-wrap items-center gap-2 lg:flex">
            <QuickSelect
              value={filters.type}
              onChange={(v) => update('type', v as Property['type'] | '')}
              placeholder={tSearch('selectType')}
            >
              {types.map((v) => (
                <option key={v} value={v}>
                  {tType(v)}
                </option>
              ))}
            </QuickSelect>

            <QuickSelect
              value={filters.district}
              onChange={(v) => update('district', v as Property['district'] | '')}
              placeholder={tSearch('selectDistrict')}
            >
              {districts.map((v) => (
                <option key={v} value={v}>
                  {tDistrict(v)}
                </option>
              ))}
            </QuickSelect>

            <QuickSelect
              value={filters.bedrooms === '' ? '' : String(filters.bedrooms)}
              onChange={(v) => update('bedrooms', v === '' ? '' : Number(v))}
              placeholder={tSearch('anyBedrooms')}
            >
              {bedroomOptions.map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </QuickSelect>

            <QuickSelect
              value={filters.priceFrom === '' ? '' : String(filters.priceFrom)}
              onChange={(v) => update('priceFrom', v === '' ? '' : Number(v))}
              placeholder={tSearch('priceFromPlaceholder')}
            >
              {pricePoints.map((p) => (
                <option key={p} value={p}>
                  {formatPrice(p, currency)}
                </option>
              ))}
            </QuickSelect>

            <QuickSelect
              value={filters.priceTo === '' ? '' : String(filters.priceTo)}
              onChange={(v) => update('priceTo', v === '' ? '' : Number(v))}
              placeholder={tSearch('priceToPlaceholder')}
            >
              {pricePoints.map((p) => (
                <option key={p} value={p}>
                  {formatPrice(p, currency)}
                </option>
              ))}
            </QuickSelect>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="ml-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-muted transition-colors duration-200 hover:text-gold-deep"
              >
                <X className="h-3 w-3" strokeWidth={1.75} />
                {tSearch('reset')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out filter panel */}
      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        filters={filters}
        onChange={onFiltersChange}
        onReset={reset}
        amenities={allAmenities}
        tags={allTags}
        types={types}
        districts={districts}
        bedroomOptions={bedroomOptions}
        pricePoints={pricePoints}
        currency={currency}
        translations={{
          tSearch,
          tType,
          tDistrict,
          tOwnership,
          tAmenities,
          tTags,
          t,
        }}
      />
    </>
  );
}

// ----- helpers -----

function QuickSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-[var(--line-strong)] bg-paper px-3.5 py-1.5 pr-8 text-[13px] font-serif italic text-teak focus:border-gold-deep focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" strokeWidth={1.75} />
    </div>
  );
}

// ----- filter panel -----

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
  onReset: () => void;
  amenities: Property['amenities'];
  tags: Property['tags'];
  types: Property['type'][];
  districts: Property['district'][];
  bedroomOptions: number[];
  pricePoints: number[];
  currency: ReturnType<typeof useCurrency>['currency'];
  translations: {
    t: ReturnType<typeof useTranslations>;
    tSearch: ReturnType<typeof useTranslations>;
    tType: ReturnType<typeof useTranslations>;
    tDistrict: ReturnType<typeof useTranslations>;
    tOwnership: ReturnType<typeof useTranslations>;
    tAmenities: ReturnType<typeof useTranslations>;
    tTags: ReturnType<typeof useTranslations>;
  };
}

function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  amenities,
  tags,
  types,
  districts,
  bedroomOptions,
  pricePoints,
  currency,
  translations: { t, tSearch, tType, tDistrict, tOwnership, tAmenities, tTags },
}: FilterPanelProps) {
  const update = <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };
  const toggleArrayItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  return (
    <>
      {/* backdrop */}
      <div
        data-open={open}
        onClick={onClose}
        className="alab-panel-backdrop fixed inset-0 z-[150] bg-ink/50"
        aria-hidden="true"
      />

      {/* panel */}
      <aside
        data-open={open}
        className="alab-panel fixed bottom-0 right-0 top-0 z-[151] flex w-full max-w-[480px] flex-col bg-paper shadow-[-24px_0_60px_rgba(26,15,8,0.15)]"
      >
        <header className="flex items-center justify-between border-b border-[var(--line)] px-7 py-5">
          <h3 className="font-serif text-2xl font-normal text-teak-deep">{t('filters')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] text-teak transition-colors hover:bg-cream-warm"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <FilterGroup label={tSearch('type')}>
            <PillGroup
              options={types.map((v) => ({ value: v, label: tType(v) }))}
              value={filters.type}
              onChange={(v) => update('type', v as Property['type'] | '')}
            />
          </FilterGroup>

          <FilterGroup label={tSearch('district')}>
            <PillGroup
              options={districts.map((v) => ({ value: v, label: tDistrict(v) }))}
              value={filters.district}
              onChange={(v) => update('district', v as Property['district'] | '')}
            />
          </FilterGroup>

          <FilterGroup label={tSearch('bedrooms')}>
            <PillGroup
              options={bedroomOptions.map((n) => ({ value: String(n), label: `${n}+` }))}
              value={filters.bedrooms === '' ? '' : String(filters.bedrooms)}
              onChange={(v) => update('bedrooms', v === '' ? '' : Number(v))}
            />
          </FilterGroup>

          <FilterGroup label={t('priceRange')}>
            <div className="grid grid-cols-2 gap-3">
              <PriceSelect
                value={filters.priceFrom}
                onChange={(v) => update('priceFrom', v)}
                placeholder={tSearch('priceFromPlaceholder')}
                points={pricePoints}
                currency={currency}
              />
              <PriceSelect
                value={filters.priceTo}
                onChange={(v) => update('priceTo', v)}
                placeholder={tSearch('priceToPlaceholder')}
                points={pricePoints}
                currency={currency}
              />
            </div>
          </FilterGroup>

          <FilterGroup label={t('ownership')}>
            <PillGroup
              options={[
                { value: 'freehold', label: tOwnership('freehold') },
                { value: 'leasehold', label: tOwnership('leasehold') },
              ]}
              value={filters.ownership}
              onChange={(v) => update('ownership', v as Property['ownership'] | '')}
            />
          </FilterGroup>

          <FilterGroup label={t('tags')}>
            <MultiPillGroup
              options={tags.map((v) => ({ value: v, label: tTags(v) }))}
              values={filters.tags as string[]}
              onChange={(v) => update('tags', toggleArrayItem(filters.tags, v as Property['tags'][number]))}
            />
          </FilterGroup>

          <FilterGroup label={t('amenities')}>
            <MultiPillGroup
              options={amenities.map((v) => ({ value: v, label: tAmenities(v) }))}
              values={filters.amenities as string[]}
              onChange={(v) => update('amenities', toggleArrayItem(filters.amenities, v as Property['amenities'][number]))}
            />
          </FilterGroup>
        </div>

        <footer className="flex items-center gap-3 border-t border-[var(--line)] px-7 py-4">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-teak transition-colors hover:bg-cream-warm"
          >
            {tSearch('reset')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-teak-deep px-7 py-3 text-xs font-medium uppercase tracking-[0.14em] text-cream transition-colors hover:bg-gold-deep"
          >
            <SearchIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t('apply')}
          </button>
        </footer>
      </aside>

      <style>{`
        .alab-panel-backdrop {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .alab-panel-backdrop[data-open='true'] {
          opacity: 1;
          pointer-events: auto;
        }
        .alab-panel {
          transform: translateX(100%);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .alab-panel[data-open='true'] {
          transform: translateX(0);
        }
      `}</style>
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = String(value) === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? '' : opt.value)}
            className={`rounded-full border px-4 py-2 text-xs transition-colors duration-200 ${
              active
                ? 'border-teak-deep bg-teak-deep text-cream'
                : 'border-[var(--line-strong)] text-teak hover:border-gold-deep hover:text-gold-deep'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPillGroup({
  options,
  values,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  values: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-4 py-2 text-xs transition-colors duration-200 ${
              active
                ? 'border-teak-deep bg-teak-deep text-cream'
                : 'border-[var(--line-strong)] text-teak hover:border-gold-deep hover:text-gold-deep'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PriceSelect({
  value,
  onChange,
  placeholder,
  points,
  currency,
}: {
  value: number | '';
  onChange: (v: number | '') => void;
  placeholder: string;
  points: number[];
  currency: ReturnType<typeof useCurrency>['currency'];
}) {
  return (
    <div className="relative">
      <select
        value={value === '' ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full appearance-none rounded-md border border-[var(--line-strong)] bg-paper px-3.5 py-2.5 pr-8 text-sm font-serif italic text-teak focus:border-gold-deep focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {points.map((p) => (
          <option key={p} value={p}>
            {formatPrice(p, currency)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" strokeWidth={1.75} />
    </div>
  );
}
