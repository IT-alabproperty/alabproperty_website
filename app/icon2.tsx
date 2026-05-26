import { ImageResponse } from 'next/og'

// PWA-grade hero icon — 512×512 is used by Android splash, PWA installer,
// share sheets, and app stores. Same composition as 192px but extra room
// for a soft gold ring frame that vanishes at smaller sizes.
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #3A2418 0%, #2B1810 100%)',
        }}
      >
        {/* Inset frame — subtle gold border at ~6% inset reads as a premium
            "sealed" mark on splash screens; disappears in maskable crop. */}
        <div
          style={{
            position: 'absolute',
            inset: 32,
            border: '2px solid rgba(201, 169, 97, 0.18)',
            borderRadius: 48,
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C9A961',
            fontFamily: 'Georgia, "Times New Roman", serif',
            letterSpacing: '-0.03em',
          }}
        >
          <div
            style={{
              fontSize: 380,
              fontWeight: 600,
              fontStyle: 'italic',
              lineHeight: 1,
              marginTop: -36,
            }}
          >
            A
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 36,
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
      </div>
    ),
    { ...size },
  )
}
