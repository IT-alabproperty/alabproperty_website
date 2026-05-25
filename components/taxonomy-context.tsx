'use client';

import { createContext, useContext, useMemo } from 'react';
import { useLocale } from 'next-intl';
import type { Locale } from '@/lib/types';

export interface TaxonomyRow {
  slug: string;
  name: { ru: string; en: string };
}
export interface DistrictRow extends TaxonomyRow {
  city_slug: string | null;
}

interface TaxonomyValue {
  cities: TaxonomyRow[];
  types: TaxonomyRow[];
  districts: DistrictRow[];
  cityLabel: (slug: string | null | undefined) => string;
  typeLabel: (slug: string | null | undefined) => string;
  districtLabel: (slug: string | null | undefined) => string;
}

const Ctx = createContext<TaxonomyValue | null>(null);

/**
 * Provides localized names for taxonomy slugs (cities / property types /
 * districts) loaded from the DB. Lives at the root layout so PropertyCard
 * — wherever it's rendered — can resolve labels without prop-drilling.
 *
 * Any new slug created in the admin (e.g. `kathu`, `phuket-town`) is shown
 * with its DB-provided RU/EN name. Unknown slugs gracefully fall back to a
 * prettified version of the slug ("phuket-town" → "Phuket Town") instead of
 * leaking the raw next-intl key path ("District.kathu").
 */
export function TaxonomyProvider({
  cities, types, districts, children,
}: {
  cities: TaxonomyRow[];
  types: TaxonomyRow[];
  districts: DistrictRow[];
  children: React.ReactNode;
}) {
  const locale = useLocale() as Locale;

  const value = useMemo<TaxonomyValue>(() => {
    const pickLabel = (row: TaxonomyRow | undefined, slug: string) => {
      if (row) return row.name?.[locale] ?? row.name?.ru ?? prettifySlug(slug);
      return prettifySlug(slug);
    };
    const cityIdx = new Map(cities.map((c) => [c.slug, c]));
    const typeIdx = new Map(types.map((c) => [c.slug, c]));
    const districtIdx = new Map(districts.map((c) => [c.slug, c]));
    return {
      cities, types, districts,
      cityLabel: (slug) => (slug ? pickLabel(cityIdx.get(slug), slug) : ''),
      typeLabel: (slug) => (slug ? pickLabel(typeIdx.get(slug), slug) : ''),
      districtLabel: (slug) => (slug ? pickLabel(districtIdx.get(slug), slug) : ''),
    };
  }, [cities, types, districts, locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Read taxonomy labels. Safe outside provider — returns a slug-prettifying
 * fallback so the component never crashes if it's rendered without one.
 */
export function useTaxonomyLabels(): TaxonomyValue {
  const v = useContext(Ctx);
  if (v) return v;
  const empty = { cities: [], types: [], districts: [] };
  return {
    ...empty,
    cityLabel: (slug) => (slug ? prettifySlug(slug) : ''),
    typeLabel: (slug) => (slug ? prettifySlug(slug) : ''),
    districtLabel: (slug) => (slug ? prettifySlug(slug) : ''),
  };
}

/** "phrom-phong" → "Phrom Phong", "kathu" → "Kathu". */
function prettifySlug(slug: string): string {
  return slug
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
