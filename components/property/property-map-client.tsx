'use client';

/**
 * Google Maps embed for the property detail page.
 *
 * Uses Google Maps' free, key-less `output=embed` URL. The trade-off:
 *  - No marker / styling control — we get Google's default UI.
 *  - But: zero ongoing cost, no Cloud project to manage, politically neutral
 *    borders (Google adjusts by viewer region), familiar UX for buyers.
 *
 * If we ever need a custom pin or click handlers, switch to the Maps
 * JavaScript API — same iframe layout, just replace src and add an API key.
 */
export function PropertyMapClient({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  // Zoom 16 is a comfortable "see the building + the block around it" level.
  // `q=lat,lng(label)` drops a pin at the exact coords and labels the popup
  // with the property name when the user clicks it.
  const q = `${lat},${lng}${label ? `(${encodeURIComponent(label)})` : ''}`;
  const src = `https://www.google.com/maps?q=${q}&hl=en&z=16&output=embed`;

  return (
    <iframe
      src={src}
      title={label || 'Map'}
      // `lazy` so the iframe doesn't block initial property-page paint —
      // the map is well below the fold.
      loading="lazy"
      // No third-party script needs to touch our window. Locks down the
      // iframe to the bare minimum it needs to render.
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        // Soft rounded corners match the surrounding card.
        display: 'block',
      }}
    />
  );
}
