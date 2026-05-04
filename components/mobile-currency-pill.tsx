'use client';

import { useEffect, useRef, useState } from 'react';
import { useCurrency } from './currency-context';
import { currencyOrder, exchangeRates } from '@/lib/currency';

interface Props {
  scrolled: boolean;
}

export function MobileCurrencyPill({ scrolled }: Props) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const others = currencyOrder.filter((c) => c !== currency);

  return (
    <div ref={ref} className="relative sm:hidden">
      {/* Options drop below — centered under the active button */}
      <div
        className="flex items-center gap-1.5 rounded-full bg-[rgba(43,24,16,0.88)] px-2 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md"
        style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: '50%',
          zIndex: 20,
          // Center under button + animate in/out as a unit
          transform: open
            ? 'translateX(-50%) translateY(0) scale(1)'
            : 'translateX(-50%) translateY(-6px) scale(0.9)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {others.map((c, i) => (
          <button
            key={c}
            type="button"
            onClick={() => { setCurrency(c); setOpen(false); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-medium text-cream/70 transition-colors duration-200 hover:bg-cream/10 hover:text-cream"
          >
            {exchangeRates[c].symbol}
          </button>
        ))}
      </div>

      {/* Active currency — always visible */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Выбор валюты"
        style={{ transition: 'background 0.4s, color 0.4s, transform 0.2s' }}
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold',
          open ? 'scale-90' : 'scale-100',
          scrolled ? 'bg-[var(--teak)] text-[var(--cream)]' : 'bg-gold text-[var(--teak-deep)]',
        ].join(' ')}
      >
        {exchangeRates[currency].symbol}
      </button>
    </div>
  );
}
