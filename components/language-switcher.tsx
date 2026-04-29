'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { localeNames, locales } from '@/lib/i18n/config';
import type { Locale } from '@/lib/types';

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const switchTo = (locale: Locale) => {
    if (locale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div className="alab-selector flex rounded-full border p-[3px]" role="group" aria-label="Language">
      {locales.map((loc) => {
        const active = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            data-active={active}
            className="alab-selector-btn min-w-[22px] rounded-full px-2 py-1 text-[11px] font-medium leading-none tracking-tight transition-all duration-300"
            aria-pressed={active}
          >
            {localeNames[loc]}
          </button>
        );
      })}
    </div>
  );
}
