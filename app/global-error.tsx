'use client'

import { useEffect } from 'react'

/**
 * Catches errors thrown anywhere in the root layout / server-rendered tree
 * that escape per-route error.tsx boundaries. Next requires this file to
 * include its own <html>/<body> because the regular layout is unavailable
 * when this renders.
 *
 * Side effect: report to the server so the tech team gets a Telegram alert.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Fire-and-forget; never let the report itself crash the page.
    fetch('/api/admin/notify-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || '(no message)',
        stack: error.stack,
        digest: error.digest,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        source: 'global-error',
      }),
      keepalive: true,
    }).catch(() => { /* swallow */ })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          backgroundColor: '#2B1810',
          color: '#F5EFE6',
          fontFamily: 'Georgia, "Times New Roman", serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.35em',
              color: '#C9A961',
              textTransform: 'uppercase',
              margin: '0 0 16px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Что-то пошло не так / Something went wrong
          </p>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 300,
              lineHeight: 1.15,
              margin: '0 0 24px',
              letterSpacing: '0.02em',
            }}
          >
            ALAB <em style={{ fontStyle: 'italic', color: '#C9A961' }}>Property</em>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(245, 239, 230, 0.7)',
              lineHeight: 1.6,
              margin: '0 0 32px',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Мы уже знаем о проблеме и работаем над ней.
            <br />
            We&apos;re aware of the issue and are fixing it.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: '#C9A961',
              color: '#2B1810',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: 99,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            На главную / Home
          </a>
        </div>
      </body>
    </html>
  )
}
