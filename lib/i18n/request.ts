import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import type { Locale } from '../types'

/**
 * URL-based locale detection via the next-intl middleware.
 * `requestLocale` is the segment from the URL ([locale] param); we validate it
 * against the configured list and fall back to the default if missing/invalid.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const isKnown =
    typeof requested === 'string' &&
    (routing.locales as readonly string[]).includes(requested)
  const locale: Locale = isKnown ? (requested as Locale) : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
