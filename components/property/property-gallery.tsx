'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PropertyGallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations('PropertyDetail');
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
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

      <div className="relative flex h-[80vh] w-[90vw] max-w-[1400px] items-center justify-center overflow-hidden rounded-3xl bg-ink/20 shadow-2xl shadow-black/40">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={images[index]}
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-2xl opacity-30 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-ink/30" />
        </div>

        <Image
          src={images[index]}
          alt={`Photo ${index + 1}`}
          fill
          sizes="(max-width: 1400px) 90vw, 1400px"
          className="relative object-contain"
          priority
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
