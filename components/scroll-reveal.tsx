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
  //
  // RSC streaming inserts .alab-reveal elements *after* the initial paint
  // (e.g. FeaturedPropertiesSection waits on Supabase). We use a MutationObserver
  // to pick those up as they arrive, otherwise they stay opacity:0 forever and
  // look like an empty block. A 4s safety net forces anything still unrevealed
  // visible so a slow network never leaves a hole in the page.
  useEffect(() => {
    if (firstLoadDone) return;
    firstLoadDone = true;

    const observed = new WeakSet<Element>();
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

    const attach = (el: Element) => {
      if (observed.has(el)) return;
      observed.add(el);
      io.observe(el);
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>('.alab-reveal').forEach(attach);
    };

    const rafId = requestAnimationFrame(scan);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.classList?.contains('alab-reveal')) attach(node);
          node.querySelectorAll?.<HTMLElement>('.alab-reveal').forEach(attach);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: anything still hidden 4s after first paint gets forced on.
    const safety = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.alab-reveal:not([data-in])').forEach((el) => {
        el.setAttribute('data-in', 'true');
      });
    }, 4000);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(safety);
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
