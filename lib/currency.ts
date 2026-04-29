import type { Currency } from './types';

/**
 * Exchange rates: how many UNITS OF TARGET CURRENCY equal 1 THB.
 * In production these should come from an API (e.g. exchangerate.host)
 * with a reasonable cache TTL.
 */
export const exchangeRates: Record<Currency, { rate: number; symbol: string }> = {
  THB: { rate: 1, symbol: '฿' },
  USD: { rate: 0.0285, symbol: '$' },
  EUR: { rate: 0.0265, symbol: '€' },
  RUB: { rate: 2.45, symbol: '₽' },
};

export function convertFromThb(thbAmount: number, target: Currency): number {
  return thbAmount * exchangeRates[target].rate;
}

/**
 * Format a price in THB into the target currency with smart truncation.
 * Examples (target=USD):
 *   24_500_000 THB → "$698K"
 *   58_000_000 THB → "$1.65M"
 *   89_000_000 THB → "$2.54M"
 */
export function formatPrice(thbAmount: number, target: Currency, locale: 'ru' | 'en' = 'ru'): string {
  const value = convertFromThb(thbAmount, target);
  const { symbol } = exchangeRates[target];

  let display: string;
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    display = m % 1 === 0 ? m.toFixed(0) : trimTrailingZeros(m.toFixed(2));
    display += 'M';
  } else if (value >= 10_000) {
    display = (value / 1_000).toFixed(0) + 'K';
  } else {
    display = Math.round(value).toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US');
  }

  return symbol + display;
}

function trimTrailingZeros(s: string): string {
  return s.replace(/\.?0+$/, '');
}

export const currencyOrder: Currency[] = ['THB', 'USD', 'EUR', 'RUB'];
