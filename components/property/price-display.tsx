'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCurrency } from '@/components/currency-context';
import type { PropertyDeal } from '@/lib/types';

export function PriceDisplay({
  priceThb,
  deal,
  areaSqm,
  isComplex,
  minUnitPrice,
}: {
  priceThb: number;
  deal: PropertyDeal;
  areaSqm: number;
  isComplex?: boolean;
  minUnitPrice?: number;
}) {
  const t = useTranslations('Deal');
  const locale = useLocale();
  const { formatFull, currency } = useCurrency();

  const displayPrice = isComplex && minUnitPrice ? minUnitPrice : priceThb;
  const pricePerSqm = priceThb && areaSqm ? priceThb / areaSqm : 0;

  return (
    <div className="text-left sm:text-right">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {t(deal)}
      </div>
      <div className="mt-1 font-serif text-4xl font-normal leading-none tracking-[-0.01em] text-teak-deep sm:text-5xl">
        {isComplex && minUnitPrice ? (
          <><span className="text-2xl sm:text-3xl">{locale === 'ru' ? 'от ' : 'from '}</span>{formatFull(displayPrice)}</>
        ) : (
          formatFull(displayPrice)
        )}
      </div>
      {!isComplex && pricePerSqm > 0 && (
        <div className="mt-1.5 text-xs text-muted">
          {formatFull(pricePerSqm)} / m²
        </div>
      )}
      {currency === 'USDT' ? (
        <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-deep">USDT ERC-20</div>
      ) : (
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-muted/60">crypto friendly</div>
      )}
    </div>
  );
}
