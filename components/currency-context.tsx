'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Currency } from '@/lib/types';
import { formatPrice as formatPriceUtil, FALLBACK_RATES } from '@/lib/currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Per-currency rate (1 THB → N TARGET). Live when API responded, fallback otherwise. */
  rates: Record<Currency, number>;
  /** ISO timestamp of last successful upstream update, null if we're on fallback. */
  updatedAt: string | null;
  format: (thbAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'alab.currency';
const RATES_CACHE_KEY = 'alab.rates';
const RATES_CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1h, same as API revalidate
const DEFAULT_CURRENCY: Currency = 'THB';

interface RatesResponse {
  ok: boolean;
  rates: Record<Currency, number>;
  updatedAt: string | null;
}

export function CurrencyProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: 'ru' | 'en';
}) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  // Start with hardcoded fallback so first paint isn't blocked on network.
  // Then upgrade to live rates once fetched (subtle update, no flicker because
  // both sets are within rounding distance for any THB amount we show).
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Hydrate selected currency from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (saved && ['THB', 'USD', 'EUR', 'RUB', 'USDT'].includes(saved)) {
        setCurrencyState(saved);
      } else {
        // smart default: RU users get RUB, EN users get USD
        setCurrencyState(locale === 'ru' ? 'RUB' : 'USD');
      }
    } catch {
      // localStorage unavailable - keep default
    }
  }, [locale]);

  // Load live rates. Cached in localStorage to keep first-paint cheap on
  // repeat visits — if cached entry is younger than the API revalidate window,
  // we trust it and skip the network entirely.
  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem(RATES_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as RatesResponse & { ts?: number };
        const age = Date.now() - (cached.ts ?? 0);
        if (age < RATES_CACHE_MAX_AGE_MS && cached.rates) {
          setRates({ ...FALLBACK_RATES, ...cached.rates });
          setUpdatedAt(cached.updatedAt ?? null);
          return;
        }
      }
    } catch {
      // Corrupt cache — fall through to network.
    }

    let cancelled = false;
    fetch('/api/rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RatesResponse | null) => {
        if (cancelled || !data || !data.rates) return;
        setRates({ ...FALLBACK_RATES, ...data.rates });
        setUpdatedAt(data.updatedAt);
        try {
          localStorage.setItem(
            RATES_CACHE_KEY,
            JSON.stringify({ ...data, ts: Date.now() }),
          );
        } catch {}
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  // Recompute format closure when rates change so subscribers re-render with
  // up-to-date numbers automatically.
  const format = useMemo(
    () => (thbAmount: number) => formatPriceUtil(thbAmount, currency, locale, rates),
    [currency, locale, rates],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, updatedAt, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
