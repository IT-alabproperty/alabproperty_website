import { ImageResponse } from 'next/og'

// Android Chrome / PWA icon — 192×192 is the canonical Android home-screen
// size. Same brand composition as apple-icon but scaled so the "PROPERTY"
// caption stays legible on small launcher tiles.
export const size = { width: 192, height: 192 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #3A2418 0%, #2B1810 100%)',
          color: '#C9A961',
          fontFamily: 'Georgia, "Times New Roman", serif',
          letterSpacing: '-0.03em',
        }}
      >
        <div
          style={{
            fontSize: 150,
            fontWeight: 600,
            fontStyle: 'italic',
            lineHeight: 1,
            marginTop: -12,
          }}
        >
          A
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 14,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(245, 239, 230, 0.6)',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
          }}
        >
          property
        </div>
      </div>
    ),
    { ...size },
  )
}
