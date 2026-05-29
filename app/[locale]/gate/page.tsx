'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GatePage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const isRu = lang === 'ru';

  // --- password ---
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // --- contact form ---
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError(false);
    const res = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setPwLoading(false);
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setPwError(true);
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError(false);
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message }),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      setEmail('');
      setMessage('');
    } else {
      setSendError(true);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#2B1810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
    }}>
      {/* ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 65% 55% at 50% 42%, rgba(201,169,97,0.08) 0%, transparent 70%)',
      }} />

      {/* lang switcher */}
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 4 }}>
        {(['ru', 'en'] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '4px 10px', borderRadius: 99, border: '1px solid',
            borderColor: lang === l ? '#C9A961' : 'rgba(245,239,230,0.2)',
            background: lang === l ? '#C9A961' : 'transparent',
            color: lang === l ? '#2B1810' : 'rgba(245,239,230,0.5)',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.1em',
            textTransform: 'uppercase', cursor: 'pointer',
          }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, maxWidth: 480, width: '100%', position: 'relative' }}>

        {/* SVG construction illustration */}
        <svg width="260" height="163" viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          <style>{`
            @keyframes alabShieldDraw { to { stroke-dashoffset: 0; } }
            @keyframes alabDetailFade { to { opacity: 1; } }
            @keyframes alabHookSway {
              0%, 100% { transform: rotate(-3deg); }
              50% { transform: rotate(3deg); }
            }
            @keyframes alabMarchAnts { to { stroke-dashoffset: -8; } }
          `}</style>

          {/* Foundation */}
          <line x1="15" y1="129" x2="210" y2="129" stroke="#EDE3D2" strokeWidth="1.3"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.6s ease-out 0.1s forwards' }} />
          {/* Left wall */}
          <line x1="35" y1="129" x2="35" y2="66" stroke="#EDE3D2" strokeWidth="1.3"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.45s ease-out 0.5s forwards' }} />
          {/* Left roof */}
          <line x1="35" y1="66" x2="110" y2="16" stroke="#EDE3D2" strokeWidth="1.3"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.45s ease-out 0.85s forwards' }} />
          {/* Window */}
          <rect x="47" y="77" width="24" height="22" stroke="#EDE3D2" strokeWidth="1.1" fill="none"
            opacity="0" style={{ animation: 'alabDetailFade 0.3s ease 1.1s forwards' }} />
          <line x1="59" y1="77" x2="59" y2="99" stroke="#EDE3D2" strokeWidth="0.7" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.2s forwards' }} />
          <line x1="47" y1="88" x2="71" y2="88" stroke="#EDE3D2" strokeWidth="0.7" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.2s forwards' }} />
          {/* Door */}
          <path d="M96 129 L96 104 Q96 97 110 97 Q124 97 124 104 L124 129"
            stroke="#EDE3D2" strokeWidth="1.1" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.4s ease-out 1.0s forwards' }} />

          {/* Scaffold poles */}
          <line x1="173" y1="129" x2="173" y2="10" stroke="#C9A961" strokeWidth="0.9"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.55s ease-out 0.6s forwards' }} />
          <line x1="207" y1="129" x2="207" y2="10" stroke="#C9A961" strokeWidth="0.9"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.55s ease-out 0.7s forwards' }} />
          {/* Planks */}
          {[108, 82, 56, 30].map((y, i) => (
            <line key={y} x1="173" y1={y} x2="207" y2={y} stroke="#C9A961" strokeWidth="1.2"
              opacity="0" style={{ animation: `alabDetailFade 0.25s ease ${0.95 + i * 0.12}s forwards` }} />
          ))}
          {/* Diagonal braces */}
          {([[108, 82], [82, 56], [56, 30]] as [number, number][]).map(([y1, y2], i) => (
            <line key={i} x1="173" y1={y1} x2="207" y2={y2} stroke="#C9A961" strokeWidth="0.7"
              strokeDasharray="3 3" opacity="0"
              style={{ animation: `alabDetailFade 0.25s ease ${1.35 + i * 0.1}s forwards` }} />
          ))}
          {/* Crane mast */}
          <line x1="207" y1="30" x2="207" y2="4" stroke="#C9A961" strokeWidth="1.1"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.3s ease-out 0.9s forwards' }} />
          {/* Crane arm */}
          <line x1="207" y1="4" x2="228" y2="4" stroke="#C9A961" strokeWidth="1.1"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            style={{ animation: 'alabShieldDraw 0.3s ease-out 1.15s forwards' }} />
          {/* Counterweight */}
          <line x1="207" y1="4" x2="198" y2="4" stroke="#C9A961" strokeWidth="2"
            opacity="0" style={{ animation: 'alabDetailFade 0.2s ease 1.4s forwards' }} />
          {/* Hook */}
          <g opacity="0" style={{
            transformOrigin: '224px 4px',
            animation: 'alabDetailFade 0.2s ease 1.5s forwards, alabHookSway 2.4s ease-in-out 1.7s infinite',
          }}>
            <line x1="224" y1="4" x2="224" y2="22" stroke="#C9A961" strokeWidth="0.8" />
            <path d="M221 22 Q219 27 224 28 Q229 27 227 22" stroke="#C9A961" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          </g>
          {/* Right roof marching ants */}
          <line x1="110" y1="16" x2="185" y2="66" stroke="#C9A961" strokeWidth="1.1"
            strokeDasharray="4 4" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.6s forwards, alabMarchAnts 0.6s linear 1.9s infinite' }} />
          {/* Right wall marching ants */}
          <line x1="185" y1="66" x2="185" y2="129" stroke="#C9A961" strokeWidth="1.1"
            strokeDasharray="4 4" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.7s forwards, alabMarchAnts 0.6s linear 2.0s infinite' }} />
          {/* Right window marching */}
          <rect x="163" y="77" width="24" height="22" stroke="#C9A961" strokeWidth="0.9" fill="none"
            strokeDasharray="3 3" opacity="0"
            style={{ animation: 'alabDetailFade 0.3s ease 1.8s forwards, alabMarchAnts 0.7s linear 2.1s infinite' }} />
        </svg>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 10, letterSpacing: '0.35em', color: '#C9A961', textTransform: 'uppercase', margin: '0 0 16px' }}>
            {isRu ? 'Сайт в разработке' : 'Site under development'}
          </p>
          <p style={{
            fontFamily: 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif',
            fontSize: 'clamp(28px, 6vw, 44px)', color: '#F5EFE6', fontWeight: 300,
            lineHeight: 1.15, margin: 0, letterSpacing: '0.03em',
          }}>
            {isRu ? <>ALAB <em style={{ fontStyle: 'italic', color: '#C9A961' }}>Property</em></> : <>ALAB <em style={{ fontStyle: 'italic', color: '#C9A961' }}>Property</em></>}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(245,239,230,0.4)', marginTop: 8, letterSpacing: '0.08em' }}>
            {isRu ? 'Скоро открытие' : 'Coming soon'}
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handlePassword} style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,239,230,0.4)' }}>
              {isRu ? 'Пароль для входа' : 'Access password'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                placeholder={isRu ? 'Введите пароль' : 'Enter password'}
                style={{
                  flex: 1, padding: '12px 16px', background: 'rgba(245,239,230,0.06)',
                  border: `1px solid ${pwError ? '#e05555' : 'rgba(245,239,230,0.15)'}`,
                  borderRadius: 6, color: '#F5EFE6', fontSize: 14, outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button type="submit" disabled={pwLoading || !password} style={{
                padding: '12px 24px', background: '#C9A961', color: '#2B1810',
                border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                opacity: pwLoading || !password ? 0.5 : 1,
              }}>
                {pwLoading ? '...' : (isRu ? 'Войти' : 'Enter')}
              </button>
            </div>
            {pwError && (
              <p style={{ fontSize: 11, color: '#e05555', margin: 0 }}>
                {isRu ? 'Неверный пароль' : 'Wrong password'}
              </p>
            )}
          </div>
        </form>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(245,239,230,0.08)' }} />

        {/* Contact section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,239,230,0.4)', margin: '0 0 8px' }}>
              {isRu ? 'Связаться с нами' : 'Contact us'}
            </p>
            <a href="mailto:property@alabproperty.com" style={{ color: '#C9A961', fontSize: 14, textDecoration: 'none', letterSpacing: '0.02em' }}>
              property@alabproperty.com
            </a>
          </div>

          {sent ? (
            <p style={{ fontSize: 13, color: '#C9A961', textAlign: 'center', padding: '16px 0' }}>
              {isRu ? '✓ Сообщение отправлено' : '✓ Message sent'}
            </p>
          ) : (
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRu ? 'Ваш email' : 'Your email'}
                required
                style={{
                  padding: '11px 14px', background: 'rgba(245,239,230,0.06)',
                  border: '1px solid rgba(245,239,230,0.15)', borderRadius: 6,
                  color: '#F5EFE6', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isRu ? 'Ваш вопрос' : 'Your message'}
                required
                rows={3}
                style={{
                  padding: '11px 14px', background: 'rgba(245,239,230,0.06)',
                  border: '1px solid rgba(245,239,230,0.15)', borderRadius: 6,
                  color: '#F5EFE6', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              {sendError && (
                <p style={{ fontSize: 11, color: '#e05555', margin: 0 }}>
                  {isRu ? 'Ошибка отправки. Напишите нам напрямую.' : 'Send error. Please email us directly.'}
                </p>
              )}
              <button type="submit" disabled={sending} style={{
                padding: '12px', background: 'transparent',
                border: '1px solid rgba(201,169,97,0.4)', borderRadius: 6,
                color: '#C9A961', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                opacity: sending ? 0.5 : 1,
              }}>
                {sending ? '...' : (isRu ? 'Отправить' : 'Send')}
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
