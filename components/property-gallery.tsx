'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

export function PropertyGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = useCallback(() => setActive((i) => (i + 1) % photos.length), [photos.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  // Keyboard navigation when lightbox is open
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox, next, prev]);

  // Mosaic layout: large lead image + 2-4 thumbs
  const lead = photos[0];
  const thumbs = photos.slice(1, 5);

  return (
    <>
      {/* Mosaic - desktop */}
      <div className="hidden gap-2 lg:grid lg:grid-cols-4 lg:grid-rows-2">
        <button
          type="button"
          onClick={() => {
            setActive(0);
            setLightbox(true);
          }}
          className="group relative col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${lead})`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </button>
        {thumbs.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => {
              setActive(i + 1);
              setLightbox(true);
            }}
            className="group relative overflow-hidden rounded"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${src})`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            {/* "View all" overlay on last visible thumb */}
            {i === thumbs.length - 1 && photos.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/55 text-cream">
                <span className="text-sm font-medium uppercase tracking-[0.16em]">+{photos.length - 5}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mobile/tablet swiper */}
      <div className="relative aspect-[4/3] overflow-hidden rounded lg:hidden">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute inset-0 z-[1]"
          aria-label="Open gallery"
        />
        {photos.map((src, i) => (
          <div
            key={src + i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
            style={{ backgroundImage: `url(${src})`, opacity: i === active ? 1 : 0 }}
            aria-hidden={i !== active}
          />
        ))}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-teak backdrop-blur-md transition-colors hover:bg-paper"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 text-teak backdrop-blur-md transition-colors hover:bg-paper"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <div className="absolute bottom-4 left-1/2 z-[2] -translate-x-1/2 rounded-full bg-ink/60 px-3 py-1 text-[11px] tracking-tight text-cream/90 backdrop-blur-md">
              {active + 1} / {photos.length}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute right-4 top-4 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-paper/85 text-teak backdrop-blur-md transition-colors hover:bg-paper"
          aria-label="Open fullscreen"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-6 top-6 z-[2] flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-6 top-1/2 z-[2] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-6 top-1/2 z-[2] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </>
          )}

          <div
            className="h-[85vh] w-[90vw] max-w-[1400px] bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${photos[active]})` }}
            role="img"
            aria-label={`${alt} ${active + 1} of ${photos.length}`}
          />

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-cream/60">
            {active + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
