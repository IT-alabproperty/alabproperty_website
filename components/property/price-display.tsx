'use client';

import { useTranslations } from 'next-intl';
import { useCurrency } from '@/components/currency-context';
import type { PropertyDeal } from '@/lib/types';

export function PriceDisplay({
  priceThb,
  deal,
  areaSqm,
}: {
  priceThb: number;
  deal: PropertyDeal;
  areaSqm: number;
}) {
  const t = useTranslations('Deal');
  const { format, currency } = useCurrency();

  const pricePerSqm = priceThb / areaSqm;

  return (
    <div className="text-right">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {t(deal)}
      </div>
      <div className="mt-1 font-serif text-4xl font-normal leading-none tracking-[-0.01em] text-teak-deep sm:text-5xl">
        {format(priceThb)}
      </div>
      <div className="mt-2 text-xs text-muted">
        {format(pricePerSqm)} / m²
      </div>
      {currency === 'USDT' ? (
        <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-deep">USDT ERC-20</div>
      ) : (
        <div className="mt-2 text-[10px] uppercase tracking-[0.1em] text-muted/60">crypto friendly</div>
      )}
    </div>
  );
}
