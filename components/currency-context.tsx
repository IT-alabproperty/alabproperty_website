'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Currency } from '@/lib/types';
import { formatPrice as formatPriceUtil } from '@/lib/currency';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (thbAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'alab.currency';
const DEFAULT_CURRENCY: Currency = 'THB';

export function CurrencyProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: 'ru' | 'en';
}) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  // hydrate from localStorage on mount
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

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  const format = (thbAmount: number) => formatPriceUtil(thbAmount, currency, locale);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
