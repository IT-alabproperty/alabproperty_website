'use client';

import { useTranslations } from 'next-intl';
import { useCurrency } from './currency-context';
import type { Property } from '@/lib/types';

export function PropertyPriceLine({
  priceThb,
  deal,
}: {
  priceThb: number;
  deal: Property['deal'];
}) {
  const { format } = useCurrency();
  const tDeal = useTranslations('Deal');

  return (
    <div>
      <div className="font-serif text-[clamp(36px,4vw,52px)] font-normal leading-none tracking-[-0.02em] text-teak-deep">
        {format(priceThb)}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gold-deep">
        {tDeal(deal)}
      </div>
    </div>
  );
}
