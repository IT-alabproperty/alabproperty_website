'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { localeNames, locales } from '@/lib/i18n/config';
import type { Locale } from '@/lib/types';

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  // Next-intl's usePathname returns the canonical path (without locale prefix);
  // for dynamic routes like /properties/[slug] it returns the actual resolved
  // value (e.g. /properties/sukhumvit-condo), so passing it straight through
  // preserves the param when switching locale.
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const switchTo = (locale: Locale) => {
    if (locale === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
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
