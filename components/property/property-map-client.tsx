'use client';

/**
 * Google Maps embed for the property detail page.
 *
 * Source-of-truth choice:
 *  - If we have an address string (always do for new properties), pass it
 *    as `?q=address` to the embed. Google's own server-side geocoder picks
 *    the exact spot — same result as searching that address in the
 *    Google Maps app. Way better than the district-centroid we used to
 *    get from Nominatim.
 *  - Coords are accepted as a fallback for legacy rows that were saved
 *    with raw lat/lng before this switch. New rows don't need them.
 *
 * Free forever — the `output=embed` URL doesn't need an API key.
 */
export function PropertyMapClient({
  query,
  lat,
  lng,
  label,
}: {
  /** Text query: full address + city + country, ideally. */
  query?: string;
  lat?: number | null;
  lng?: number | null;
  label: string;
}) {
  let src: string | null = null;

  const trimmedQuery = query?.trim();
  if (trimmedQuery && trimmedQuery.length >= 3) {
    const q = encodeURIComponent(trimmedQuery);
    src = `https://www.google.com/maps?q=${q}&hl=en&z=16&output=embed`;
  } else if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const q = `${lat},${lng}${label ? `(${encodeURIComponent(label)})` : ''}`;
    src = `https://www.google.com/maps?q=${q}&hl=en&z=16&output=embed`;
  }

  if (!src) return null;

  return (
    <iframe
      src={src}
      title={label || 'Map'}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
    />
  );
}
