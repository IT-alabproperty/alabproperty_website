'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronDown, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCurrency } from './currency-context';
import { formatPrice } from '@/lib/currency';

// True after first mount — skip intro animation on client-side navigation.
let searchFirstLoadDone = false;

const types = ['condo', 'villa', 'townhouse', 'penthouse', 'land'] as const;
const CITIES = ['bangkok', 'pattaya'] as const;
const districts = ['sukhumvit', 'silom', 'sathorn', 'thonglor', 'phrom-phong', 'asok', 'riverside', 'ari'] as const;
const bedroomOptions = [1, 2, 3, 4, 5];
// price points in THB - displayed in selected currency
const pricePoints = [3_000_000, 5_000_000, 10_000_000, 15_000_000, 25_000_000, 40_000_000, 60_000_000, 100_000_000];

export function SearchBar() {
  const t = useTranslations('Search');
  const tType = useTranslations('PropertyType');
  const tDistrict = useTranslations('District');
  const tCity = useTranslations('City');
  const { currency } = useCurrency();

  const [skipAnim, setSkipAnim] = useState(false);
  useEffect(() => {
    if (searchFirstLoadDone) setSkipAnim(true);
    searchFirstLoadDone = true;
  }, []);

  const [deal] = useState<'sale' | 'rent'>('sale');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [code, setCode] = useState('');

  const reset = () => {
    setType('');
    setCity('');
    setDistrict('');
    setPriceFrom('');
    setPriceTo('');
    setBedrooms('');
    setCode('');
  };

  return (
    <div
      className={`${skipAnim ? '' : 'alab-fade-in'} alab-search relative z-30 mx-auto w-[calc(100%-32px)] max-w-[1240px] sm:w-[calc(100%-64px)] lg:w-[calc(100%-112px)]`}
      style={skipAnim ? undefined : { animationDelay: '1.6s' }}
    >
      {/* deal tabs */}
      <div className="flex">
        <button
          type="button"
          data-active={deal === 'sale'}
          className="alab-search-tab"
        >
          {t('forSale')}
        </button>
      </div>

      {/* search panel */}
      <div className="alab-search-panel rounded-r-lg rounded-bl-lg bg-paper/96 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-5">
        {/* Row 1: Type | City | District | Bedrooms */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-3">
          <SelectField label={t('type')} value={type} onChange={setType} placeholder={t('selectType')}>
            {types.map((v) => (
              <option key={v} value={v}>
                {tType(v)}
              </option>
            ))}
          </SelectField>

          <SelectField label={t('city')} value={city} onChange={setCity} placeholder={t('selectCity')}>
            {CITIES.map((v) => (
              <option key={v} value={v}>
                {tCity(v)}
              </option>
            ))}
          </SelectField>

          <SelectField label={t('district')} value={district} onChange={setDistrict} placeholder={t('selectDistrict')}>
            {districts.map((v) => (
              <option key={v} value={v}>
                {tDistrict(v)}
              </option>
            ))}
          </SelectField>

          <SelectField label={t('bedrooms')} value={bedrooms} onChange={setBedrooms} placeholder={t('anyBedrooms')}>
            {bedroomOptions.map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </SelectField>
        </div>

        {/* Row 2: Price From | Price To | Code | Search */}
        <div className="mt-2 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-3">
          <SelectField label={t('priceFrom')} value={priceFrom} onChange={setPriceFrom} placeholder={t('priceFromPlaceholder')}>
            {pricePoints.map((p) => (
              <option key={p} value={p}>
                {formatPrice(p, currency)}
              </option>
            ))}
          </SelectField>

          <SelectField label={t('priceTo')} value={priceTo} onChange={setPriceTo} placeholder={t('priceToPlaceholder')}>
            {pricePoints.map((p) => (
              <option key={p} value={p}>
                {formatPrice(p, currency)}
              </option>
            ))}
          </SelectField>

          <div className="alab-search-input-wrap">
            <label className="alab-search-input-label">{t('code')}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('codePlaceholder')}
              className="alab-search-input"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 sm:items-stretch">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-teak-deep px-6 text-xs font-medium uppercase tracking-[0.14em] text-cream transition-colors duration-400 hover:bg-gold-deep sm:flex-initial sm:px-7"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>{t('find')}</span>
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label={t('reset')}
              title={t('reset')}
              className="flex h-full items-center justify-center rounded-md border border-[var(--line-strong)] bg-transparent px-3 text-teak transition-colors duration-300 hover:bg-cream-warm"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .alab-search-tab {
          flex: 0 1 auto;
          min-width: 110px;
          padding: 12px 28px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245, 239, 230, 0.65);
          background: rgba(43, 24, 16, 0.55);
          backdrop-filter: blur(20px);
          border: none;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          transition: background 0.4s, color 0.4s;
        }
        .alab-search-tab:hover { color: var(--cream); }
        .alab-search-tab[data-active='true'] {
          background: rgb(251, 248, 242);
          color: var(--teak-deep);
        }
        .alab-search-tab + .alab-search-tab { margin-left: 2px; }

        .alab-search-input-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 8px 14px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 6px;
          min-width: 0;
        }
        .alab-search-input-wrap:focus-within { border-color: var(--gold-deep); }
        .alab-search-input-label {
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 2px;
        }
        .alab-search-input {
          width: 100%;
          min-width: 0;
          border: none;
          background: transparent;
          font-family: var(--font-cormorant), serif;
          font-size: 16px;
          color: var(--teak);
          outline: none;
        }
        .alab-search-input::placeholder {
          color: var(--muted);
          opacity: 0.6;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}

function SelectField({ label, value, onChange, placeholder, children }: SelectFieldProps) {
  return (
    <div className="alab-search-input-wrap relative">
      <label className="alab-search-input-label">{label}</label>
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="alab-search-select"
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-muted"
          strokeWidth={1.75}
        />
      </div>

      <style>{`
        .alab-search-select {
          width: 100%;
          min-width: 0;
          padding-right: 20px;
          border: none;
          background: transparent;
          font-family: var(--font-cormorant), serif;
          font-size: 16px;
          color: var(--teak);
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        .alab-search-select:invalid,
        .alab-search-select option[value=''] {
          color: var(--muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
