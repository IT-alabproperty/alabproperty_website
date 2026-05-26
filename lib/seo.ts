import type { Metadata } from 'next';
import type { Locale } from './types';

// Canonical production origin. metadataBase + alternates.canonical rely on this,
// so we hard-code instead of reading from env to avoid silent prod misconfig.
export const SITE_URL = 'https://alabproperty.com';
export const SITE_ORIGIN = new URL(SITE_URL);

export const OG_LOCALE: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};

/** First N chars of a plain-text string, trimmed at the last word boundary. */
export function truncate(input: string | null | undefined, max = 160): string {
  if (!input) return '';
  const stripped = input.replace(/\s+/g, ' ').trim();
  if (stripped.length <= max) return stripped;
  const cut = stripped.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max - 30 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

interface BuildMetadataInput {
  locale: Locale;
  title: string;
  description: string;
  /** Path WITHOUT leading host, e.g. "/properties". Default "/". */
  path?: string;
  /** Absolute URL or root-relative path to an OG image. */
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  /** Override og:type. Default "website". */
  ogType?: 'website' | 'article' | 'profile';
  /** When true, page is excluded from indexing (used for /gate). */
  noindex?: boolean;
}

/**
 * Build a Metadata object with consistent OG/Twitter/canonical for every page.
 * Centralised so the per-page generateMetadata stays small and uniform.
 */
export function buildMetadata({
  locale,
  title,
  description,
  path = '/',
  image,
  imageAlt,
  imageWidth = 1200,
  imageHeight = 630,
  ogType = 'website',
  noindex = false,
}: BuildMetadataInput): Metadata {
  const canonicalUrl = new URL(path, SITE_URL).toString();
  const images = image
    ? [
        {
          url: image,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt ?? title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: ogType,
      url: canonicalUrl,
      siteName: 'ALAB Property',
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: locale === 'ru' ? OG_LOCALE.en : OG_LOCALE.ru,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}
