import { ImageResponse } from 'next/og'

// Browser favicon: 32×32 with safe falloff for 16×16. Programmatic so we
// don't ship a binary file and so the colour palette stays in code where
// it's grep-able if we ever rebrand.
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2B1810',
          color: '#C9A961',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 26,
          fontWeight: 600,
          fontStyle: 'italic',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          paddingBottom: 2,
        }}
      >
        A
      </div>
    ),
    { ...size },
  )
}
