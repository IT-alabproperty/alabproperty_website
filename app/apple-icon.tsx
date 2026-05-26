import { ImageResponse } from 'next/og'

// iOS home-screen icon. iOS doesn't round our corners for us (uses our shape as-is),
// so we draw a square — system rounding on iOS 14+ applies a 22.4% radius mask.
// 180×180 is the canonical Apple touch icon size; Apple downscales for smaller slots.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function AppleIcon() {
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
        {/* Big monogram letter */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 600,
            fontStyle: 'italic',
            lineHeight: 1,
            marginTop: -12,
          }}
        >
          A
        </div>
        {/* Subtle wordmark below — only readable at large sizes, vanishes on
            smaller iOS scale-downs but adds polish on the full 180px icon. */}
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
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
