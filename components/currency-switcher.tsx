'use client';

import { useCurrency } from './currency-context';
import { currencyOrder, exchangeRates } from '@/lib/currency';

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="alab-selector flex rounded-full border p-[3px]" role="group" aria-label="Currency">
      {currencyOrder.map((c) => {
        const active = currency === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            data-active={active}
            className="alab-selector-btn min-w-[22px] rounded-full px-2 py-1 text-[11px] font-medium leading-none tracking-tight transition-all duration-300"
            aria-pressed={active}
          >
            {exchangeRates[c].symbol}
          </button>
        );
      })}
    </div>
  );
}
