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
 * - Displays in its natural aspect ratio (no forced crop). Browser picks the
 *   intrinsic ratio once the image loads.
 * - Tap/click opens a lightbox so the user can inspect the full image.
 * - If the image fails to load (expired URL, blocked CDN, deleted storage
 *   object), we render an on-brand placeholder instead of leaving a broken
 *   icon in the middle of an empty rectangle.
 */
export function BlogBlockImage({ src, alt }: Props) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  // Capture intrinsic dimensions so Next/Image can render with a stable
  // aspect-ratio box and the browser doesn't have to relayout when the
  // image arrives. Defaults are a reasonable landscape until we know.
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 1600, h: 1067 });

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
        style={{ aspectRatio: '16 / 10' }}
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
      >
        <Image
          src={src}
          alt={alt}
          width={dims.w}
          height={dims.h}
          sizes="(min-width: 1024px) 820px, 100vw"
          className="block h-auto w-full"
          onError={() => setBroken(true)}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight && img.naturalWidth !== dims.w) {
              setDims({ w: img.naturalWidth, h: img.naturalHeight });
            }
          }}
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
