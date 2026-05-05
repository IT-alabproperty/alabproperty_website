import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function NotFound() {
  let isRu = true;
  try {
    const locale = await getLocale();
    isRu = locale === 'ru';
  } catch { /* outside locale context — default to ru */ }
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#2B1810',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 65% 55% at 50% 42%, rgba(201,169,97,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          position: 'relative',
          maxWidth: 520,
          width: '100%',
        }}
      >
        {/* ── CONSTRUCTION ILLUSTRATION ── */}
        <svg
          width="300"
          height="188"
          viewBox="0 0 240 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          {/* ── COMPLETE SIDE (left) — cream strokes, draw-in ── */}

          {/* Foundation */}
          <line
            x1="15" y1="129" x2="210" y2="129"
            stroke="#EDE3D2" strokeWidth="1.3"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.6s ease-out 0.1s forwards' }}
          />

          {/* Left wall */}
          <line
            x1="35" y1="129" x2="35" y2="66"
            stroke="#EDE3D2" strokeWidth="1.3"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.45s ease-out 0.5s forwards' }}
          />

          {/* Left roof */}
          <line
            x1="35" y1="66" x2="110" y2="16"
            stroke="#EDE3D2" strokeWidth="1.3"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.45s ease-out 0.85s forwards' }}
          />

          {/* Left window */}
          <rect
            x="47" y="77" width="24" height="22"
            stroke="#EDE3D2" strokeWidth="1.1" fill="none"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.1s forwards' }}
          />
          {/* Window cross */}
          <line x1="59" y1="77" x2="59" y2="99" stroke="#EDE3D2" strokeWidth="0.7" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.2s forwards' }} />
          <line x1="47" y1="88" x2="71" y2="88" stroke="#EDE3D2" strokeWidth="0.7" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.2s forwards' }} />

          {/* Door (arched) */}
          <path
            d="M96 129 L96 104 Q96 97 110 97 Q124 97 124 104 L124 129"
            stroke="#EDE3D2" strokeWidth="1.1" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.4s ease-out 1.0s forwards' }}
          />

          {/* ── SCAFFOLDING (gold, solid) ── */}

          {/* Left scaffold pole */}
          <line
            x1="173" y1="129" x2="173" y2="10"
            stroke="#C9A961" strokeWidth="0.9"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.55s ease-out 0.6s forwards' }}
          />

          {/* Right scaffold pole */}
          <line
            x1="207" y1="129" x2="207" y2="10"
            stroke="#C9A961" strokeWidth="0.9"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.55s ease-out 0.7s forwards' }}
          />

          {/* Planks */}
          {[108, 82, 56, 30].map((y, i) => (
            <line key={y}
              x1="173" y1={y} x2="207" y2={y}
              stroke="#C9A961" strokeWidth="1.2"
              opacity="0"
              style={{ animation: `alabDetailFade 0.25s ease ${0.95 + i * 0.12}s forwards` }}
            />
          ))}

          {/* Diagonal braces (dashed) */}
          {[[108, 82], [82, 56], [56, 30]].map(([y1, y2], i) => (
            <line key={i}
              x1="173" y1={y1} x2="207" y2={y2}
              stroke="#C9A961" strokeWidth="0.7"
              strokeDasharray="3 3"
              opacity="0"
              style={{ animation: `alabDetailFade 0.25s ease ${1.35 + i * 0.1}s forwards` }}
            />
          ))}

          {/* ── CRANE ── */}

          {/* Crane mast */}
          <line
            x1="207" y1="30" x2="207" y2="4"
            stroke="#C9A961" strokeWidth="1.1"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.3s ease-out 0.9s forwards' }}
          />

          {/* Crane arm */}
          <line
            x1="207" y1="4" x2="228" y2="4"
            stroke="#C9A961" strokeWidth="1.1"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.3s ease-out 1.15s forwards' }}
          />

          {/* Counterweight */}
          <line
            x1="207" y1="4" x2="198" y2="4"
            stroke="#C9A961" strokeWidth="2"
            opacity="0"
            style={{ animation: 'alabDetailFade 0.2s ease 1.4s forwards' }}
          />

          {/* Hook string + hook (swaying) */}
          <g
            opacity="0"
            style={{
              transformOrigin: '224px 4px',
              animation: 'alabDetailFade 0.2s ease 1.5s forwards, alabHookSway 2.4s ease-in-out 1.7s infinite',
            }}
          >
            <line x1="224" y1="4" x2="224" y2="22" stroke="#C9A961" strokeWidth="0.8" />
            <path
              d="M221 22 Q219 27 224 28 Q229 27 227 22"
              stroke="#C9A961" strokeWidth="0.9" fill="none" strokeLinecap="round"
            />
          </g>

          {/* ── WIP ELEMENTS (gold, marching dashes) ── */}

          {/* Right roof — marching ants */}
          <line
            x1="110" y1="16" x2="185" y2="66"
            stroke="#C9A961" strokeWidth="1.1"
            strokeDasharray="4 4"
            opacity="0"
            style={{
              animation:
                'alabDetailFade 0.3s ease 1.6s forwards, alabMarchAnts 0.6s linear 1.9s infinite',
            }}
          />

          {/* Right wall — marching ants */}
          <line
            x1="185" y1="66" x2="185" y2="129"
            stroke="#C9A961" strokeWidth="1.1"
            strokeDasharray="4 4"
            opacity="0"
            style={{
              animation:
                'alabDetailFade 0.3s ease 1.7s forwards, alabMarchAnts 0.6s linear 2.0s infinite',
            }}
          />

          {/* Right window — faint marching */}
          <rect
            x="163" y="77" width="24" height="22"
            stroke="#C9A961" strokeWidth="0.9" fill="none"
            strokeDasharray="3 3"
            opacity="0"
            style={{
              animation:
                'alabDetailFade 0.3s ease 1.8s forwards, alabMarchAnts 0.7s linear 2.1s infinite',
            }}
          />
        </svg>

        {/* ── TEXT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, textAlign: 'center' }}>

          {/* eyebrow */}
          <p
            style={{
              fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
              fontSize: 10,
              letterSpacing: '0.35em',
              color: '#C9A961',
              fontWeight: 400,
              margin: '0 0 20px',
              textTransform: 'uppercase',
              opacity: 0,
              animation: 'alab404FadeUp 0.5s ease 1.8s forwards',
            }}
          >
            — 404 —
          </p>

          {/* headline */}
          <p
            style={{
              fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
              fontSize: 'clamp(32px, 7vw, 52px)',
              letterSpacing: '0.04em',
              color: '#F5EFE6',
              fontWeight: 300,
              margin: 0,
              lineHeight: 1.1,
              opacity: 0,
              animation: 'alab404FadeUp 0.6s ease 1.95s forwards',
            }}
          >
            {isRu ? 'Эта страница' : 'This page'}
            <br />
            <em>{isRu ? 'ещё строится' : 'is coming soon'}</em>
          </p>

          {/* gold rule */}
          <div
            style={{
              width: 36,
              height: 1,
              background: 'linear-gradient(90deg, transparent, #C9A961, transparent)',
              margin: '22px 0',
              transformOrigin: 'center',
              transform: 'scaleX(0)',
              opacity: 0,
              animation: 'alabLineExpand 0.5s cubic-bezier(0.16,1,0.3,1) 2.2s forwards',
            }}
          />

          {/* subtitle */}
          <p
            style={{
              fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: '0.15em',
              color: 'rgba(245,239,230,0.4)',
              fontWeight: 300,
              margin: 0,
              textTransform: 'uppercase',
              opacity: 0,
              animation: 'alab404FadeUp 0.5s ease 2.3s forwards',
            }}
          >
            {isRu ? 'Эта страница в разработке' : 'This page is under development'}
          </p>
        </div>

        {/* ── CTA ── */}
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            fontSize: 11,
            letterSpacing: '0.2em',
            color: '#2B1810',
            backgroundColor: '#C9A961',
            padding: '12px 32px',
            textDecoration: 'none',
            textTransform: 'uppercase',
            fontWeight: 400,
            display: 'inline-block',
            opacity: 0,
            animation: 'alab404FadeUp 0.5s ease 2.5s forwards',
          }}
        >
          {isRu ? '← На главную' : '← Home'}
        </Link>
      </div>
    </main>
  );
}
