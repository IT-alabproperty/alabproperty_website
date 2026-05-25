'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Maximize2, ImageOff } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
}

/**
 * Inline image inside a blog post body.
 *
 * Body images use a fixed 16:9 aspect (with object-cover) so the article
 * column reads as a clean grid no matter the upload — portrait phone shots,
 * panoramas, squares all crop to the same frame. The full uncropped image
 * is still one tap away via the lightbox.
 *
 * If the image fails to load (expired URL, blocked CDN, deleted storage
 * object), an on-brand placeholder is shown in the same 16:9 box.
 */
export function BlogBlockImage({ src, alt }: Props) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (broken) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-2 rounded bg-cream-warm text-teak/30"
        style={{ aspectRatio: '16 / 9' }}
        aria-hidden="true"
      >
        <ImageOff className="h-6 w-6" strokeWidth={1.25} />
        <span className="text-[10px] font-medium uppercase tracking-[0.24em]">
          ALAB Property
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt || 'View full image'}
        className="group relative block w-full overflow-hidden rounded transition-opacity hover:opacity-95"
        style={{ aspectRatio: '16 / 9' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 820px, 100vw"
          className="object-cover"
          onError={() => setBroken(true)}
        />
        <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/55 text-cream opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Close"
            className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </>
  );
}
