'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

// Module-level: survives React re-renders/Strict Mode double-invoke,
// resets only on full page reload.
let firstLoadDone = false;

export function ScrollRevealMount() {
  const pathname = usePathname();

  // On client-side navigation: add data-navigated to body before first paint.
  // This CSS attribute makes ALL .alab-reveal elements instantly visible via
  // the global CSS rule — including server-component elements that arrive in
  // later RSC streaming chunks (CSS applies the moment they enter the DOM).
  useLayoutEffect(() => {
    if (!firstLoadDone) return;
    document.body.setAttribute('data-navigated', '1');
  }, [pathname]);

  // First load only: scroll-triggered reveal via IntersectionObserver.
  // body[data-navigated] is NOT set here, so the normal scroll animation runs.
  useEffect(() => {
    if (firstLoadDone) return;
    firstLoadDone = true;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            setTimeout(() => el.setAttribute('data-in', 'true'), i * 80);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );

    const rafId = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('.alab-reveal').forEach((el) => {
        io.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, []);

  return null;
}
