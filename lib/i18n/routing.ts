import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import { defaultLocale, locales } from './config'

/**
 * Shared routing config used by:
 *   - the next-intl middleware (URL → locale resolution)
 *   - the localized navigation helpers below (Link, useRouter, redirect)
 *
 * `localePrefix: 'as-needed'` keeps the default locale at the root
 * (`alabproperty.com/properties` stays RU, `alabproperty.com/en/properties`
 * is the English version) — no existing URL breaks.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

// Use these in components instead of next/link / next/navigation so that
// internal links automatically include /en for English users (and stay
// prefix-less for Russian, since RU is the default).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
