'use client';

import { useEffect, useRef } from 'react';

// Cloudflare Turnstile global API surface. Lives on window after the script
// loads; we declare only what we use to keep this file free of any new deps.
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'normal' | 'compact' | 'invisible';
          theme?: 'light' | 'dark' | 'auto';
          appearance?: 'always' | 'execute' | 'interaction-only';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * Invisible Cloudflare Turnstile widget. Renders nothing visible until CF
 * decides a challenge is needed; on success, calls onToken with the JWT that
 * the server then verifies via /turnstile/v0/siteverify.
 *
 * Activates only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Without it the
 * component is a no-op — the form still ships honeypot + timestamp defences.
 *
 * Setup:
 *   1. cloudflare.com → Turnstile → New Site → pick "Invisible" widget mode
 *   2. Vercel env vars (Production + Preview):
 *      - NEXT_PUBLIC_TURNSTILE_SITE_KEY = the sitekey
 *      - TURNSTILE_SECRET_KEY = the secret (used in /api/leads server check)
 *   3. Redeploy. Widget activates automatically.
 */
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !container) return;
      // Already rendered (Strict Mode re-mount) — skip
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        size: 'invisible',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };

    // Load script once globally if not already present
    if (window.turnstile) {
      renderWidget();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = renderWidget;
      document.head.appendChild(s);
    } else {
      // Script tag present but turnstile global not ready yet (still loading);
      // poll briefly. CF API loads in ~200ms typically.
      const id = setInterval(() => {
        if (cancelled) { clearInterval(id); return; }
        if (window.turnstile) { clearInterval(id); renderWidget(); }
      }, 100);
      // Stop polling after 10s either way
      setTimeout(() => clearInterval(id), 10_000);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
