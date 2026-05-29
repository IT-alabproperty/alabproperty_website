'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'

// Route-transition loader used as the [locale]/loading.tsx Suspense fallback.
//
// UX rules:
//   1. Only show after the page has been pending for >2s — gives normal
//      navigations breathing room and avoids any flash for snappy clicks.
//   2. After ~4.5s the loader still hasn't given up → reveal a small "skip"
//      affordance so the user can dismiss the splash and see whatever skeleton
//      / partial content is mounting underneath. The page itself keeps
//      loading — we just hide our overlay.
//
// The 2s delay is enforced via CSS `animation-delay: 2s` on a fade-in keyframe.
// If Next.js unmounts the fallback (page loaded) before 2s, the animation
// never fires and nothing is painted.
export function RouteLoading() {
  const locale = useLocale()
  const [skipVisible, setSkipVisible] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    // Skip button appears after 4.5s — that's 2.5s after the overlay itself
    // shows up. By that point the user has clearly been waiting and would
    // appreciate the choice to dismiss.
    const t = setTimeout(() => setSkipVisible(true), 4500)
    return () => clearTimeout(t)
  }, [])

  if (skipped) return null

  const skipLabel = locale === 'en' ? 'Skip' : 'Пропустить'

  const ariaLabel = locale === 'en' ? 'Loading' : 'Загрузка'

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      onClick={() => setSkipped(true)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2B1810',
        opacity: 0,
        animation: 'alabRouteLoaderFade 0.4s cubic-bezier(0.16,1,0.3,1) 2s forwards',
        cursor: skipVisible ? 'pointer' : 'default',
        // Pointer events off until the skip button is meant to be tappable —
        // we don't want to swallow stray clicks during the first second.
        pointerEvents: skipVisible ? 'auto' : 'none',
      }}
    >
      {/* ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 55% 55% at 50% 48%, rgba(201,169,97,0.10) 0%, transparent 70%)',
          animation: 'alabGlowPulse 2.8s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          position: 'relative',
          animation: 'alabRouteLoaderPulse 1.8s ease-in-out infinite',
        }}
      >
        {/* Shield + building — same mark as the splash, no draw animation */}
        <svg width="78" height="86" viewBox="0 0 100 112" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 6 L93 22 L93 68 Q93 93 50 109 Q7 93 7 68 L7 22 Z"
            fill="rgba(201,169,97,0.05)"
          />
          <path
            d="M50 6 L93 22 L93 68 Q93 93 50 109 Q7 93 7 68 L7 22 Z"
            stroke="#C9A961"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M26 57 L50 37 L74 57"
            stroke="#C9A961"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M30 57 L30 81 L70 81 L70 57"
            stroke="#C9A961"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="34" y="61" width="10" height="9" stroke="#C9A961" strokeWidth="1.1" fill="none" />
          <rect x="56" y="61" width="10" height="9" stroke="#C9A961" strokeWidth="1.1" fill="none" />
          <path
            d="M44 81 L44 71 Q44 66 50 66 Q56 66 56 71 L56 81"
            stroke="#C9A961"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div
            style={{
              width: 36,
              height: 1,
              background: 'linear-gradient(90deg, transparent, #C9A961, transparent)',
              marginBottom: 14,
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              fontSize: 22,
              letterSpacing: '0.3em',
              color: '#F5EFE6',
              fontWeight: 300,
              margin: 0,
              lineHeight: 1,
            }}
          >
            ALAB
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              fontSize: 10,
              letterSpacing: '0.5em',
              color: '#C9A961',
              fontWeight: 400,
              margin: '6px 0 0',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            PROPERTY
          </p>
        </div>
      </div>

      {/* Skip affordance — only shows up after we've waited long enough that
          dismissing makes sense. Click anywhere on the overlay also works
          (the parent has the onClick) — this button is just an explicit hint. */}
      {skipVisible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSkipped(true)
          }}
          aria-label={skipLabel}
          style={{
            position: 'absolute',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 36px)',
            padding: '10px 22px',
            borderRadius: 9999,
            border: '1px solid rgba(201,169,97,0.5)',
            background: 'rgba(245,239,230,0.04)',
            color: 'rgba(245,239,230,0.85)',
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 500,
            cursor: 'pointer',
            opacity: 0,
            animation: 'alabRouteLoaderFade 0.5s cubic-bezier(0.16,1,0.3,1) 0s forwards',
            transition: 'background-color 0.2s, border-color 0.2s',
          }}
        >
          {skipLabel}
        </button>
      )}
    </div>
  )
}
