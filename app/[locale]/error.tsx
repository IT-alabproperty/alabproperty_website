'use client'

import { useEffect } from 'react'

/**
 * Route-level error boundary. Catches errors thrown inside this segment's
 * server/client rendering without taking down the whole app. Sister to
 * global-error.tsx which fires when the root layout itself crashes.
 *
 * Reports the error to the server so tech admins get a Telegram alert,
 * then shows a friendly retry UI in the site's normal layout (Nav/Footer
 * stay visible because this only replaces the affected route content).
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    fetch('/api/admin/notify-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || '(no message)',
        stack: error.stack,
        digest: error.digest,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        source: 'error-boundary',
      }),
      keepalive: true,
    }).catch(() => { /* never let reporting break the recovery UI */ })
  }, [error])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-paper px-6 py-24 text-center">
      <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted">
        Что-то пошло не так / Something went wrong
      </p>
      <h1 className="font-serif text-[clamp(28px,4vw,40px)] font-normal leading-[1.05] text-teak-deep">
        Страница временно недоступна
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-teak-warm">
        Мы уже знаем о проблеме и работаем над ней. Попробуйте перезагрузить.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-teak-deep px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-gold-deep"
        >
          Попробовать снова
        </button>
        <a
          href="/"
          className="rounded-full border border-[var(--line-strong)] px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-teak transition-colors hover:border-gold-deep hover:text-gold-deep"
        >
          На главную
        </a>
      </div>
    </main>
  )
}
