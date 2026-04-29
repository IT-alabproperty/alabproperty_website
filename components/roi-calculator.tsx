'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, Info } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useCurrency } from './currency-context';
import { formatPrice } from '@/lib/currency';

interface RoiCalculatorProps {
  propertyPriceThb: number;
  /** Suggested monthly rent in THB based on similar units */
  suggestedMonthlyRentThb: number;
}

export function RoiCalculator({ propertyPriceThb, suggestedMonthlyRentThb }: RoiCalculatorProps) {
  const t = useTranslations('Roi');
  const { currency, format } = useCurrency();

  // User-controlled inputs
  const [monthlyRent, setMonthlyRent] = useState(suggestedMonthlyRentThb);
  const [annualExpensesPct, setAnnualExpensesPct] = useState(15); // % of gross rent
  const [vacancyPct, setVacancyPct] = useState(8); // % of months vacant
  const [appreciationPct, setAppreciationPct] = useState(4); // % per year capital growth
  const [horizon, setHorizon] = useState<5 | 10>(10);

  // Calculations
  const grossAnnualRent = monthlyRent * 12;
  const occupancyFactor = 1 - vacancyPct / 100;
  const effectiveAnnualRent = grossAnnualRent * occupancyFactor;
  const annualExpenses = effectiveAnnualRent * (annualExpensesPct / 100);
  const netAnnualIncome = effectiveAnnualRent - annualExpenses;
  const grossYieldPct = (grossAnnualRent / propertyPriceThb) * 100;
  const netYieldPct = (netAnnualIncome / propertyPriceThb) * 100;

  // Chart data: cumulative net income + asset value over time
  const chartData = useMemo(() => {
    const data = [];
    let assetValue = propertyPriceThb;
    let cumulativeIncome = 0;
    for (let year = 0; year <= horizon; year++) {
      data.push({
        year: `${t('yearLabel')} ${year}`,
        assetValue: Math.round(assetValue),
        cumulativeIncome: Math.round(cumulativeIncome),
        totalReturn: Math.round(cumulativeIncome + (assetValue - propertyPriceThb)),
      });
      cumulativeIncome += netAnnualIncome;
      assetValue *= 1 + appreciationPct / 100;
    }
    return data;
  }, [propertyPriceThb, netAnnualIncome, appreciationPct, horizon, t]);

  const finalRow = chartData[chartData.length - 1];
  const totalReturnAbs = finalRow.totalReturn;
  const totalReturnPct = (totalReturnAbs / propertyPriceThb) * 100;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-paper p-6 sm:p-9">
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-deep/10 text-gold-deep">
          <TrendingUp className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-normal text-teak-deep">{t('title')}</h3>
          <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SliderField
          label={t('monthlyRent')}
          value={format(monthlyRent)}
          min={Math.round(suggestedMonthlyRentThb * 0.4)}
          max={Math.round(suggestedMonthlyRentThb * 2)}
          step={Math.round(suggestedMonthlyRentThb * 0.02) || 1000}
          numericValue={monthlyRent}
          onChange={setMonthlyRent}
        />

        <SliderField
          label={t('annualExpenses')}
          value={`${annualExpensesPct}%`}
          min={0}
          max={40}
          step={1}
          numericValue={annualExpensesPct}
          onChange={setAnnualExpensesPct}
          help={t('annualExpensesHelp')}
        />

        <SliderField
          label={t('vacancy')}
          value={`${vacancyPct}%`}
          min={0}
          max={30}
          step={1}
          numericValue={vacancyPct}
          onChange={setVacancyPct}
          help={t('vacancyHelp')}
        />

        <SliderField
          label={t('appreciation')}
          value={`${appreciationPct}%`}
          min={0}
          max={10}
          step={0.5}
          numericValue={appreciationPct}
          onChange={setAppreciationPct}
          help={t('appreciationHelp')}
        />
      </div>

      {/* Horizon toggle */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{t('horizon')}</span>
        <div className="flex rounded-full border border-[var(--line-strong)] p-1">
          {([5, 10] as const).map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setHorizon(y)}
              className={`rounded-full px-4 py-1 text-xs font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
                horizon === y ? 'bg-teak-deep text-cream' : 'text-muted hover:text-teak'
              }`}
            >
              {t('years', { n: y })}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded bg-cream-warm sm:grid-cols-4">
        <Metric label={t('grossYield')} value={`${grossYieldPct.toFixed(2)}%`} />
        <Metric label={t('netYield')} value={`${netYieldPct.toFixed(2)}%`} highlight />
        <Metric label={t('netAnnualIncome')} value={format(netAnnualIncome)} />
        <Metric label={t('totalReturn', { years: horizon })} value={`+${totalReturnPct.toFixed(0)}%`} highlight />
      </div>

      {/* Chart */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-medium uppercase tracking-[0.14em] text-teak">
            {t('chartTitle', { years: horizon })}
          </h4>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="alabAssetFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3A2418" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3A2418" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="alabIncomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A961" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C9A961" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,36,24,0.08)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#8C7A6B' }}
                axisLine={{ stroke: 'rgba(58,36,24,0.12)' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatPrice(v as number, currency)}
                tick={{ fontSize: 11, fill: '#8C7A6B' }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                cursor={{ stroke: 'rgba(168,136,47,0.4)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="assetValue"
                name={t('assetValue')}
                stroke="#3A2418"
                strokeWidth={2}
                fill="url(#alabAssetFill)"
              />
              <Area
                type="monotone"
                dataKey="cumulativeIncome"
                name={t('cumulativeIncome')}
                stroke="#A8882F"
                strokeWidth={2}
                fill="url(#alabIncomeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teak" />
            {t('assetValue')}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gold-deep" />
            {t('cumulativeIncome')}
          </span>
        </div>
      </div>

      <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.75} />
        {t('disclaimer')}
      </p>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  numericValue,
  onChange,
  help,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  numericValue: number;
  onChange: (v: number) => void;
  help?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</label>
        <span className="font-serif text-lg text-teak-deep">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numericValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="alab-roi-slider w-full"
      />
      {help && <p className="mt-1.5 text-[11px] text-muted/85">{help}</p>}

      <style jsx>{`
        .alab-roi-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: var(--line);
          border-radius: 100px;
          outline: none;
        }
        .alab-roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: var(--teak-deep);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid var(--cream);
          box-shadow: 0 2px 8px rgba(58, 36, 24, 0.2);
          transition: transform 0.15s;
        }
        .alab-roi-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .alab-roi-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--teak-deep);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid var(--cream);
          box-shadow: 0 2px 8px rgba(58, 36, 24, 0.2);
        }
      `}</style>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-5 ${highlight ? 'bg-teak-deep text-cream' : 'bg-paper'}`}>
      <div
        className={`text-[10px] uppercase tracking-[0.16em] ${highlight ? 'text-cream/65' : 'text-muted'}`}
      >
        {label}
      </div>
      <div className={`mt-1.5 font-serif text-xl font-normal sm:text-2xl ${highlight ? 'text-gold' : 'text-teak-deep'}`}>
        {value}
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: ReturnType<typeof useCurrency>['currency'];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-[var(--line-strong)] bg-paper px-4 py-3 shadow-lg">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-3 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-teak-warm">{p.name}:</span>
          <span className="font-serif text-base text-teak-deep">{formatPrice(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}
