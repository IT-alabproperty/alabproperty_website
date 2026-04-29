'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRevealMount() {
  const pathname = usePathname();

  useEffect(() => {
    let io: IntersectionObserver;

    // Small delay so Next.js finishes rendering the new page's DOM
    const timer = setTimeout(() => {
      const els = document.querySelectorAll<HTMLElement>('.alab-reveal:not([data-in="true"])');
      io = new IntersectionObserver(
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
      els.forEach((el) => io.observe(el));
    }, 60);

    return () => {
      clearTimeout(timer);
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
