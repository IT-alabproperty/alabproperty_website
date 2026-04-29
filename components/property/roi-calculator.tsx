'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/components/currency-context';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { Property } from '@/lib/types';

/**
 * ROI Calculator
 *
 * Inputs (all editable by the user):
 * - purchase price (defaults from property)
 * - monthly rent (defaults from property's estimatedMonthlyRentThb)
 * - annual expenses % (management fees + taxes + maintenance + insurance)
 * - vacancy % (months/year unrented)
 * - annual appreciation % (defaults from property)
 * - horizon: 5 or 10 years
 *
 * Outputs:
 * - gross yield = annual rent / purchase price
 * - net yield = (annual rent * (1 - vacancy) * (1 - expenses)) / price
 * - year-by-year asset value + cumulative net income
 * - chart: stacked area showing both
 */

const DEFAULT_EXPENSES_PCT = 25; // 25% of gross income covers fees, tax, maintenance, insurance
const DEFAULT_VACANCY_PCT = 8;   // ~1 month / year empty

export function RoiCalculator({ property }: { property: Property }) {
  const t = useTranslations('Roi');
  const { format, currency } = useCurrency();

  const [monthlyRent, setMonthlyRent] = useState(property.estimatedMonthlyRentThb ?? Math.round(property.priceThb * 0.005));
  const [expensesPct, setExpensesPct] = useState(DEFAULT_EXPENSES_PCT);
  const [vacancyPct, setVacancyPct] = useState(DEFAULT_VACANCY_PCT);
  const [appreciationPct, setAppreciationPct] = useState(property.estimatedAnnualAppreciationPct ?? 5);
  const [horizon, setHorizon] = useState<5 | 10>(5);

  const result = useMemo(() => {
    const price = property.priceThb;
    const annualGross = monthlyRent * 12;
    const grossYield = (annualGross / price) * 100;

    const occupancyFactor = 1 - vacancyPct / 100;
    const expenseFactor = 1 - expensesPct / 100;
    const annualNet = annualGross * occupancyFactor * expenseFactor;
    const netYield = (annualNet / price) * 100;

    // Year-by-year projection
    const series: Array<{
      year: number;
      assetValue: number;
      cumulativeNet: number;
      total: number; // assetValue - originalPrice + cumulativeNet
    }> = [];
    let assetValue = price;
    let cumulativeNet = 0;
    for (let y = 1; y <= horizon; y++) {
      assetValue *= 1 + appreciationPct / 100;
      cumulativeNet += annualNet;
      series.push({
        year: y,
        assetValue,
        cumulativeNet,
        total: assetValue - price + cumulativeNet,
      });
    }

    return { annualGross, annualNet, grossYield, netYield, series };
  }, [property.priceThb, monthlyRent, expensesPct, vacancyPct, appreciationPct, horizon]);

  return (
    <div className="rounded-lg bg-cream-warm/40 p-6 sm:p-10">
      <Eyebrow className="mb-6">{t('title')}</Eyebrow>
      <p className="mb-10 max-w-[520px] text-base leading-[1.6] text-teak-warm">{t('subtitle')}</p>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
        {/* Inputs */}
        <div className="space-y-6">
          <NumberInput
            label={t('monthlyRent')}
            value={monthlyRent}
            onChange={setMonthlyRent}
            step={5000}
            display={format(monthlyRent)}
          />
          <RangeInput
            label={t('annualExpenses')}
            help={t('annualExpensesHelp')}
            value={expensesPct}
            onChange={setExpensesPct}
            min={0} max={50} step={1}
            suffix="%"
          />
          <RangeInput
            label={t('vacancy')}
            help={t('vacancyHelp')}
            value={vacancyPct}
            onChange={setVacancyPct}
            min={0} max={30} step={1}
            suffix="%"
          />
          <RangeInput
            label={t('appreciation')}
            help={t('appreciationHelp')}
            value={appreciationPct}
            onChange={setAppreciationPct}
            min={0} max={12} step={0.5}
            suffix="%"
          />

          <div>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{t('horizon')}</div>
            <div className="flex gap-2">
              {([5, 10] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setHorizon(y)}
                  className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
                    horizon === y
                      ? 'border-teak-deep bg-teak-deep text-cream'
                      : 'border-[var(--line-strong)] bg-paper text-teak hover:border-teak-deep'
                  }`}
                >
                  {t('years', { n: y })}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-8">
          {/* Yield numbers */}
          <div className="grid grid-cols-2 gap-4">
            <Stat label={t('grossYield')} value={`${result.grossYield.toFixed(1)}%`} />
            <Stat label={t('netYield')} value={`${result.netYield.toFixed(1)}%`} highlight />
            <Stat label={t('netAnnualIncome')} value={format(result.annualNet)} />
            <Stat
              label={t('totalReturn', { years: horizon })}
              value={format(result.series[result.series.length - 1].total)}
              highlight
            />
          </div>

          {/* Chart */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                {t('chartTitle', { years: horizon })}
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teak-deep" />
                  <span className="text-muted">{t('assetValue')}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  <span className="text-muted">{t('cumulativeIncome')}</span>
                </span>
              </div>
            </div>
            <RoiChart series={result.series} basePrice={property.priceThb} format={format} />
          </div>
        </div>
      </div>

      <p className="mt-10 text-[11px] leading-[1.6] text-muted">{t('disclaimer')}</p>
    </div>
  );
}

// ============================================================
// CHART
// ============================================================

function RoiChart({
  series,
  basePrice,
  format,
}: {
  series: Array<{ year: number; assetValue: number; cumulativeNet: number; total: number }>;
  basePrice: number;
  format: (n: number) => string;
}) {
  const W = 560;
  const H = 220;
  const padX = 40;
  const padY = 28;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const maxValue = Math.max(...series.map((p) => p.assetValue + p.cumulativeNet));
  const minValue = basePrice;
  const range = maxValue - minValue || 1;

  const x = (i: number) => padX + (innerW * i) / Math.max(1, series.length - 1);
  const y = (v: number) => padY + innerH * (1 - (v - minValue) / range);

  const buildPath = (key: 'assetValue' | 'totalCombined'): string => {
    if (series.length === 0) return '';
    return series
      .map((p, i) => {
        const value = key === 'assetValue' ? p.assetValue : p.assetValue + p.cumulativeNet;
        return `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(value).toFixed(2)}`;
      })
      .join(' ');
  };

  // Filled areas
  const buildArea = (key: 'assetValue' | 'totalCombined'): string => {
    if (series.length === 0) return '';
    const baseY = y(minValue);
    const top = series
      .map((p, i) => {
        const value = key === 'assetValue' ? p.assetValue : p.assetValue + p.cumulativeNet;
        return `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(value).toFixed(2)}`;
      })
      .join(' ');
    return `${top} L ${x(series.length - 1)} ${baseY} L ${x(0)} ${baseY} Z`;
  };

  const finalPoint = series[series.length - 1];

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padX}
            x2={W - padX}
            y1={padY + innerH * p}
            y2={padY + innerH * p}
            stroke="rgba(58,36,24,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* combined area (asset + income) */}
        <path d={buildArea('totalCombined')} fill="rgba(201,169,97,0.18)" />
        {/* asset value area */}
        <path d={buildArea('assetValue')} fill="rgba(43,24,16,0.08)" />

        {/* combined line */}
        <path
          d={buildPath('totalCombined')}
          fill="none"
          stroke="rgb(201,169,97)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* asset value line */}
        <path
          d={buildPath('assetValue')}
          fill="none"
          stroke="rgb(43,24,16)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* X-axis labels (years) */}
        {series.map((p, i) => {
          // Show every year for 5y, every other year for 10y
          const showLabel = series.length <= 5 || i === 0 || i === series.length - 1 || (i + 1) % 2 === 0;
          if (!showLabel) return null;
          return (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="rgb(140,122,107)"
              fontFamily="inherit"
              letterSpacing="0.1em"
            >
              {p.year}Y
            </text>
          );
        })}

        {/* Final-point label */}
        <circle
          cx={x(series.length - 1)}
          cy={y(finalPoint.assetValue + finalPoint.cumulativeNet)}
          r={4}
          fill="rgb(201,169,97)"
        />
      </svg>

      <div className="mt-1 text-right text-[11px] text-muted">
        {format(finalPoint.assetValue + finalPoint.cumulativeNet)}
      </div>
    </div>
  );
}

// ============================================================
// INPUT COMPONENTS
// ============================================================

function NumberInput({
  label, value, onChange, step, display,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  display: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, +e.target.value || 0))}
          step={step}
          className="w-full rounded-md border border-[var(--line-strong)] bg-paper px-4 py-2.5 font-serif text-lg text-teak-deep outline-none transition-colors focus:border-gold-deep"
        />
        <span className="whitespace-nowrap font-serif text-base text-muted">{display}</span>
      </div>
    </div>
  );
}

function RangeInput({
  label, help, value, onChange, min, max, step, suffix,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {label}
        </label>
        <span className="font-serif text-lg text-teak-deep">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        min={min}
        max={max}
        step={step}
        className="alab-range w-full"
      />
      {help && <p className="mt-1 text-[11px] text-muted">{help}</p>}
      <style>{`
        .alab-range {
          appearance: none;
          height: 4px;
          background: linear-gradient(to right, var(--gold-deep) ${((value - min) / (max - min)) * 100}%, var(--line-strong) ${((value - min) / (max - min)) * 100}%);
          border-radius: 2px;
          outline: none;
        }
        .alab-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--teak-deep);
          border: 2px solid var(--paper);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .alab-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .alab-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--teak-deep);
          border: 2px solid var(--paper);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md p-4 ${highlight ? 'bg-teak-deep text-cream' : 'bg-paper'}`}>
      <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] ${highlight ? 'text-gold' : 'text-muted'}`}>
        {label}
      </div>
      <div className={`font-serif text-2xl font-normal ${highlight ? 'text-cream' : 'text-teak-deep'}`}>
        {value}
      </div>
    </div>
  );
}
