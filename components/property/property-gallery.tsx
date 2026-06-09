'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2, ImageOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PropertyGallery({ images: rawImages, name }: { images: string[]; name: string }) {
  const t = useTranslations('PropertyDetail');
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Drop images whose URLs fail to load (blocked CDN, expired link, etc.)
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const markBroken = (src: string) =>
    setBroken((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });

  const images = rawImages.filter((src) => src && !broken.has(src));

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[16/9] w-full items-center justify-center gap-2 rounded bg-cream-warm text-teak/30">
        <ImageOff className="h-8 w-8" strokeWidth={1.25} />
        <span className="text-[11px] font-medium uppercase tracking-[0.22em]">
          ALAB Property
        </span>
      </div>
    );
  }

  // Cover layout: 1 large left + 2 small right (desktop)
  const [main, ...rest] = images;
  const sideImages = rest.slice(0, 2);
  const remainingCount = images.length - 3;
  const hasSideImages = sideImages.length > 0;

  return (
    <>
      {/* Layout */}
      <div className={`grid grid-cols-1 gap-2 ${hasSideImages ? 'sm:grid-cols-[2fr_1fr]' : 'single-photo'}`}>
        {/* Main image — when there is only one photo we cap its width so it
            doesn't sprawl across the full container on desktop. */}
        <div className={hasSideImages ? '' : 'mx-auto w-full sm:max-w-[680px]'}>
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded"
            aria-label={`${name} — main photo`}
          >
            <Image
              src={main}
              alt={name}
              fill
              sizes={hasSideImages
                ? '(max-width: 640px) 100vw, 60vw'
                : '(max-width: 640px) 100vw, 680px'}
              priority
              className="object-cover"
              onError={() => markBroken(main)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/30 transition-opacity hover:opacity-90" />
            <span className="absolute bottom-4 left-4 z-[2] flex items-center gap-2 rounded-full bg-paper/95 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-teak">
              <Maximize2 className="h-3 w-3" strokeWidth={1.75} />
              {t('showMorePhotos', { count: images.length })}
            </span>
          </button>
        </div>

        {/* Side images */}
        {hasSideImages && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:grid-rows-2">
            {sideImages.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setLightbox(i + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded transition-opacity hover:opacity-95"
                aria-label={`${name} — photo ${i + 2}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 280px"
                  className="object-cover"
                  onError={() => markBroken(src)}
                />
                {i === 1 && remainingCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
                    <span className="font-serif text-3xl font-light text-cream">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          images={images}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  // Per-URL loaded flag. We use the URL (not the index) so navigating away
  // and back doesn't re-flash the spinner for an image we already fetched.
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const isCurrentLoaded = loaded.has(images[index]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Prefetch adjacent images so the next ← / → press feels instant. The
  // active <Image> below picks a srcset variant based on viewport + DPR; we
  // mirror its `srcset`/`sizes` here so the browser picks the SAME variant
  // and warms the HTTP cache for the exact URL that will be requested on
  // navigation. Without matching variants the prefetch lands in a different
  // cache key (e.g. w=1920 prefetched but Retina <Image> hits w=3840) and
  // does no good.
  useEffect(() => {
    if (images.length < 2) return;
    const NEXT_DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
    const buildSrcset = (src: string) =>
      NEXT_DEVICE_SIZES
        .map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75 ${w}w`)
        .join(', ');
    const targets = [
      images[(index + 1) % images.length],
      images[(index - 1 + images.length) % images.length],
    ];
    const els: HTMLImageElement[] = targets.map((src) => {
      const img = new window.Image();
      img.sizes = '(max-width: 1400px) 90vw, 1400px';
      img.srcset = buildSrcset(src);
      return img;
    });
    return () => { els.forEach((img) => { img.srcset = ''; img.src = ''; }); };
  }, [index, images]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/95 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
      >
        <X className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
        aria-label="Previous"
        className="absolute left-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </button>

      <div className="relative flex h-[80vh] w-[90vw] max-w-[1400px] items-center justify-center overflow-hidden rounded-3xl bg-ink/40 shadow-2xl shadow-black/40">
        {/*
          Loading spinner. Visible until the active image's onLoad fires.
          Previously the panel showed a blurred copy of the image as a
          background, which forced a second Vercel image-optimizer fetch
          (different `sizes` → different cache key → doubled bytes on every
          lightbox open). Solid tinted backdrop achieves the same look and
          halves the bytes-per-open.
        */}
        {!isCurrentLoaded && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream/30 border-t-gold" />
          </div>
        )}

        <Image
          // `key` forces React to remount on src change. Without it, next/image
          // sometimes keeps the previous bitmap visible until the new one
          // decodes, which makes the spinner state look out of sync with the
          // image swap.
          key={images[index]}
          src={images[index]}
          alt={`Photo ${index + 1}`}
          fill
          sizes="(max-width: 1400px) 90vw, 1400px"
          className={`relative object-contain transition-opacity duration-200 ${isCurrentLoaded ? 'opacity-100' : 'opacity-0'}`}
          priority
          onLoad={() => {
            const src = images[index];
            setLoaded((prev) => {
              if (prev.has(src)) return prev;
              const next = new Set(prev);
              next.add(src);
              return next;
            });
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % images.length)}
        aria-label="Next"
        className="absolute right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
      >
        <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-cream/70">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
