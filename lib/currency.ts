import type { Currency } from './types';

/** Per-currency display symbol — never changes regardless of live rate. */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  USDT: '₮',
};

/**
 * Fallback exchange rates: how many UNITS OF TARGET CURRENCY equal 1 THB.
 * Used when the live API is unreachable or hasn't loaded yet. Kept in sync
 * with rough market levels — won't be wildly off if the API is down for a day.
 */
export const FALLBACK_RATES: Record<Currency, number> = {
  THB: 1,
  USD: 0.0285,
  EUR: 0.0265,
  RUB: 2.45,
  USDT: 0.0285,
};

/**
 * @deprecated Use FALLBACK_RATES + CURRENCY_SYMBOLS, or pull live rates from
 * useCurrency().rates. Kept for backwards compat with older imports.
 */
export const exchangeRates: Record<Currency, { rate: number; symbol: string }> = {
  THB: { rate: FALLBACK_RATES.THB, symbol: CURRENCY_SYMBOLS.THB },
  USD: { rate: FALLBACK_RATES.USD, symbol: CURRENCY_SYMBOLS.USD },
  EUR: { rate: FALLBACK_RATES.EUR, symbol: CURRENCY_SYMBOLS.EUR },
  RUB: { rate: FALLBACK_RATES.RUB, symbol: CURRENCY_SYMBOLS.RUB },
  USDT: { rate: FALLBACK_RATES.USDT, symbol: CURRENCY_SYMBOLS.USDT },
};

export function convertFromThb(
  thbAmount: number,
  target: Currency,
  rates: Record<Currency, number> = FALLBACK_RATES,
): number {
  return thbAmount * (rates[target] ?? FALLBACK_RATES[target]);
}

/**
 * Format a price in THB into the target currency with smart truncation.
 * Examples (target=USD):
 *   24_500_000 THB → "$698K"
 *   58_000_000 THB → "$1.65M"
 *   89_000_000 THB → "$2.54M"
 */
export function formatPrice(
  thbAmount: number,
  target: Currency,
  locale: 'ru' | 'en' = 'ru',
  rates: Record<Currency, number> = FALLBACK_RATES,
): string {
  const value = convertFromThb(thbAmount, target, rates);
  const symbol = CURRENCY_SYMBOLS[target];

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

/**
 * Full (non-truncated) price format with locale-appropriate thousands
 * separators. Use this on the property detail page where the buyer wants to
 * see the exact number, not a "$1.65M" approximation.
 * Examples (target=USD, locale=en):
 *   24_500_000 THB → "$698,250"
 *   58_000_000 THB → "$1,653,000"
 * Examples (target=RUB, locale=ru):
 *   24_500_000 THB → "₽60 025 000"
 */
export function formatPriceFull(
  thbAmount: number,
  target: Currency,
  locale: 'ru' | 'en' = 'ru',
  rates: Record<Currency, number> = FALLBACK_RATES,
): string {
  const value = convertFromThb(thbAmount, target, rates);
  const symbol = CURRENCY_SYMBOLS[target];
  const intl = locale === 'ru' ? 'ru-RU' : 'en-US';
  return symbol + Math.round(value).toLocaleString(intl);
}

export const currencyOrder: Currency[] = ['THB', 'USD', 'EUR', 'RUB', 'USDT'];
