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
  const { formatFull, currency } = useCurrency();

  const pricePerSqm = priceThb / areaSqm;

  return (
    // Mobile: left-aligned in a normal reading flow under the title.
    // Desktop: right-aligned, takes the role of a price tag in the header.
    // Without the `text-left sm:text-right` swap, on mobile the text would
    // hug the right edge of its (auto-width) box and look detached from
    // the rest of the header.
    <div className="text-left sm:text-right">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {t(deal)}
      </div>
      {/* Full (non-truncated) number — buyers want to see the exact figure on
          the detail page, not the "$1.65M" approximation used in cards/lists. */}
      <div className="mt-1 font-serif text-4xl font-normal leading-none tracking-[-0.01em] text-teak-deep sm:text-5xl">
        {formatFull(priceThb)}
      </div>
      <div className="mt-1.5 text-xs text-muted">
        {formatFull(pricePerSqm)} / m²
      </div>
      {currency === 'USDT' ? (
        <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-deep">USDT ERC-20</div>
      ) : (
        <div className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-muted/60">crypto friendly</div>
      )}
    </div>
  );
}
