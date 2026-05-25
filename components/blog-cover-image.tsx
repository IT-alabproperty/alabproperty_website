'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  /** CSS aspect-ratio of the cover frame, e.g. "16 / 10" or "16 / 9". */
  aspectRatio: string;
  sizes: string;
  priority?: boolean;
  coverFocus?: string | null;
  coverZoom?: number | null;
}

/**
 * Blog cover image with an on-brand fallback. Used both for the list-view
 * cards (16:10) and the detail hero (16:9). When the image fails to load
 * (expired URL, blocked CDN, broken Supabase Storage path), we drop a tidy
 * ALAB-themed placeholder into the same aspect-ratio box instead of leaving
 * a huge empty rectangle with the browser's broken-image glyph.
 */
export function BlogCoverImage({
  src, alt, aspectRatio, sizes, priority, coverFocus, coverZoom,
}: Props) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (broken) {
    return <CoverPlaceholder aspectRatio={aspectRatio} />;
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
      {!loaded && (
        <div className="absolute inset-0 alab-image-skeleton" aria-hidden="true" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          objectPosition: coverFocus ?? '50% 50%',
          transform: coverZoom ? `scale(${coverZoom})` : undefined,
          transformOrigin: coverFocus ?? '50% 50%',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function CoverPlaceholder({ aspectRatio }: { aspectRatio: string }) {
  return (
    <div
      className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-cream-warm text-teak/30"
      style={{ aspectRatio }}
      aria-hidden="true"
    >
      <ImageOff className="h-7 w-7" strokeWidth={1.25} />
      <span className="text-[10px] font-medium uppercase tracking-[0.24em]">
        ALAB Property
      </span>
    </div>
  );
}
