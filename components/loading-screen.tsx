'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('gone');

  useEffect(() => {
    if (sessionStorage.getItem('alab.splash')) {
      return;
    }
    sessionStorage.setItem('alab.splash', '1');
    setPhase('in');

    const t1 = setTimeout(() => setPhase('out'), 2600);
    const t2 = setTimeout(() => setPhase('gone'), 3150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2B1810',
        transition: phase === 'out' ? 'opacity 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'auto',
      }}
    >
      {/* ambient radial glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 55% 55% at 50% 48%, rgba(201,169,97,0.10) 0%, transparent 70%)',
        animation: 'alabGlowPulse 2.8s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, position: 'relative' }}>

        {/* ── ICON ── */}
        <svg
          width="100"
          height="112"
          viewBox="0 0 100 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield fill — very subtle */}
          <path
            d="M50 6 L93 22 L93 68 Q93 93 50 109 Q7 93 7 68 L7 22 Z"
            fill="rgba(201,169,97,0.05)"
          />

          {/* Shield outline — draws in */}
          <path
            d="M50 6 L93 22 L93 68 Q93 93 50 109 Q7 93 7 68 L7 22 Z"
            stroke="#C9A961"
            strokeWidth="1.4"
            fill="none"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 1s cubic-bezier(0.16,1,0.3,1) 0.1s forwards' }}
          />

          {/* Building — roof */}
          <path
            d="M26 57 L50 37 L74 57"
            stroke="#C9A961"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.55s cubic-bezier(0.16,1,0.3,1) 0.9s forwards' }}
          />

          {/* Building — walls */}
          <path
            d="M30 57 L30 81 L70 81 L70 57"
            stroke="#C9A961"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.5s cubic-bezier(0.16,1,0.3,1) 1.3s forwards' }}
          />

          {/* Left window */}
          <rect
            x="34" y="61" width="10" height="9"
            stroke="#C9A961" strokeWidth="1.1" fill="none"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.35s ease 1.65s forwards' }}
          />

          {/* Right window */}
          <rect
            x="56" y="61" width="10" height="9"
            stroke="#C9A961" strokeWidth="1.1" fill="none"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.35s ease 1.75s forwards' }}
          />

          {/* Door — arched */}
          <path
            d="M44 81 L44 71 Q44 66 50 66 Q56 66 56 71 L56 81"
            stroke="#C9A961"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.35s ease 1.85s forwards' }}
          />

          {/* Guarantee mark — small shield-base ornament */}
          <circle
            cx="50" cy="106"
            r="2.2"
            fill="#C9A961"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.4s ease 1.95s forwards' }}
          />
          <circle
            cx="50" cy="106"
            r="5"
            stroke="#C9A961"
            strokeWidth="0.8"
            fill="none"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.4s ease 2.05s forwards' }}
          />
        </svg>

        {/* ── TEXT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* gold rule */}
          <div style={{
            width: 40,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #C9A961, transparent)',
            marginBottom: 18,
            transformOrigin: 'center',
            transform: 'scaleX(0)',
            opacity: 0,
            animation: 'alabLineExpand 0.5s cubic-bezier(0.16,1,0.3,1) 1.9s forwards',
          }} />

          <p style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            fontSize: 26,
            letterSpacing: '0.3em',
            color: '#F5EFE6',
            fontWeight: 300,
            margin: 0,
            lineHeight: 1,
            opacity: 0,
            animation: 'alabTextReveal 0.6s cubic-bezier(0.16,1,0.3,1) 2.0s forwards',
          }}>
            ALAB
          </p>

          <p style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            fontSize: 11,
            letterSpacing: '0.5em',
            color: '#C9A961',
            fontWeight: 400,
            margin: '8px 0 0',
            lineHeight: 1,
            textTransform: 'uppercase',
            opacity: 0,
            animation: 'alabTextReveal 0.6s cubic-bezier(0.16,1,0.3,1) 2.1s forwards',
          }}>
            PROPERTY
          </p>

          {/* gold rule bottom */}
          <div style={{
            width: 40,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #C9A961, transparent)',
            marginTop: 18,
            transformOrigin: 'center',
            transform: 'scaleX(0)',
            opacity: 0,
            animation: 'alabLineExpand 0.5s cubic-bezier(0.16,1,0.3,1) 2.1s forwards',
          }} />

          <p style={{
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(245,239,230,0.38)',
            fontWeight: 300,
            margin: '16px 0 0',
            textTransform: 'uppercase',
            opacity: 0,
            animation: 'alabTextReveal 0.5s cubic-bezier(0.16,1,0.3,1) 2.25s forwards',
          }}>
            Legal Excellence in Real Estate
          </p>
        </div>
      </div>
    </div>
  );
}
