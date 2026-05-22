'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { useCurrency } from './currency-context';
import type { Property, Locale } from '@/lib/types';

type CardMode = 'grid' | 'list';

function translateTaxonomy(
  translate: (key: string) => string,
  key: string | null | undefined,
  fallback: string,
) {
  if (!key) return fallback
  try {
    return translate(key)
  } catch {
    return fallback
  }
}

const HOVER_INTERVAL_MS = 1600;
const TOUCH_HOVER_DELAY_MS = 1400;
const AUTO_PLAY_VISIBLE_MS = 987;

export function PropertyCard({
  property,
  mode = 'grid',
}: {
  property: Property;
  mode?: CardMode;
}) {
  const locale = useLocale() as Locale;
  const tDistrict = useTranslations('District');
  const tDeal = useTranslations('Deal');
  const tProperty = useTranslations('Property');
  const tStatus = useTranslations('Status');
  const tTags = useTranslations('Tags');
  const { format } = useCurrency();

  const images = [property.coverImage, ...property.gallery.filter((g) => g !== property.coverImage)];
  const [activeImg, setActiveImg] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLAnchorElement | null>(null);

  // Hover slideshow: cycles through images while pointer is over the card.
  // Touch devices: starts after a short hold, not on a quick tap.
  useEffect(() => {
    if (!hovered || images.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % images.length);
    }, HOVER_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hovered, images.length]);

  // Reset to cover image when hover ends
  useEffect(() => {
    if (!hovered) setActiveImg(0);
  }, [hovered]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    const handleChange = (event: MediaQueryListEvent) => setIsTouchDevice(event.matches);

    setIsTouchDevice(mediaQuery.matches);
    mediaQuery.onchange = handleChange;

    return () => {
      mediaQuery.onchange = null;
    };
  }, []);

  useEffect(() => {
    if (!cardRef.current || !isTouchDevice || images.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!hovered && !visibleTimerRef.current) {
            visibleTimerRef.current = setTimeout(() => {
              setHovered(true);
              visibleTimerRef.current = null;
            }, AUTO_PLAY_VISIBLE_MS);
          }
        } else {
          if (visibleTimerRef.current) {
            clearTimeout(visibleTimerRef.current);
            visibleTimerRef.current = null;
          }
          if (hovered) setHovered(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
        visibleTimerRef.current = null;
      }
    };
  }, [isTouchDevice, hovered, images.length]);

  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
        visibleTimerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const isAvailable = property.status === 'available';
  const investorPick = property.tags.includes('investor-pick');
  const districtLabel = translateTaxonomy(tDistrict, property.district, property.district ?? '—');

  const onPointerEnter = () => setHovered(true);
  const onPointerLeave = () => setHovered(false);

  const onTouchStart = () => {
    if (images.length <= 1) return;
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => {
      setHovered(true);
      touchTimeoutRef.current = null;
    }, TOUCH_HOVER_DELAY_MS);
  };

  const onTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setHovered(false);
  };

  const onTouchMove = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  };

  if (mode === 'list') {
    return (
      <Link
        ref={cardRef}
        href={`/properties/${property.slug}`}
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        className="group grid grid-cols-1 gap-6 border-b border-[var(--line)] pb-8 transition-opacity hover:opacity-95 sm:grid-cols-[minmax(0,360px)_1fr] sm:gap-8"
      >
        {/* image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded">
          <ImageStack images={images} activeIndex={activeImg} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-ink/60" />
          {investorPick && (
            <span className="absolute left-4 top-4 z-[2] rounded-full bg-gold px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-teak-deep">
              {tTags('investor-pick')}
            </span>
          )}
          {!isAvailable && (
            <span className="absolute right-4 top-4 z-[2] rounded-full bg-teak-deep/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cream">
              {tStatus(property.status)}
            </span>
          )}
          <ImageDots count={images.length} active={activeImg} />
        </div>

        {/* details */}
        <div className="flex flex-col justify-between py-2">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
              <span>{districtLabel} · {tProperty('areaLabel', { n: property.areaSqm })}</span>
              {property.code && (
                <span className="font-mono tracking-[0.2em] text-muted/55">· {property.code}</span>
              )}
            </div>
            <h3 className="font-serif text-3xl font-normal leading-tight text-teak-deep">
              {property.name[locale]}
            </h3>
            <p className="mt-2 text-sm text-muted">{property.address[locale]}</p>
            <p className="mt-4 line-clamp-2 max-w-[60ch] text-sm leading-[1.6] text-teak-warm">
              {property.description[locale]}
            </p>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {tDeal(property.deal)}
              </div>
              <div className="font-serif text-2xl font-normal text-teak-deep">
                {format(property.priceThb)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-teak-warm transition-colors group-hover:text-gold-deep">
              <span>{tProperty('bedroomsLabel', { count: property.bedrooms })}</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default: grid mode
  return (
    <Link
      ref={cardRef}
      href={`/properties/${property.slug}`}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      className="group block cursor-pointer transition-transform duration-700 hover:-translate-y-1"
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded">
        <ImageStack
          images={images}
          activeIndex={activeImg}
          coverFocus={property.coverFocus}
          coverZoom={property.coverZoom}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-ink/70" />

        {investorPick && (
          <span className="absolute left-4 top-4 z-[2] rounded-full bg-gold px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-teak-deep">
            {tTags('investor-pick')}
          </span>
        )}
        {!isAvailable && (
          <span className="absolute right-4 top-4 z-[2] rounded-full bg-teak-deep/90 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cream">
            {tStatus(property.status)}
          </span>
        )}
        <span className="absolute left-5 top-5 z-[2] hidden">
          {districtLabel}
        </span>

        <div className="absolute bottom-6 left-6 z-[2] font-serif text-[28px] font-normal leading-none tracking-[-0.01em] text-cream">
          {format(property.priceThb)}
          <em className="ml-1.5 text-sm font-light italic opacity-70">{tDeal(property.deal)}</em>
        </div>

        <ImageDots count={images.length} active={activeImg} />
      </div>

      <div className="px-1">
        <div className="mb-1.5 font-serif text-2xl font-normal text-teak-deep">
          {property.name[locale]}
        </div>
        <div className="mb-4 text-[13px] tracking-tight text-muted">
          {districtLabel} · {property.address[locale]}
        </div>
        <div className="flex gap-3.5 border-t border-[var(--line)] pt-4 text-xs text-teak-warm">
          <span>{tProperty('bedroomsLabel', { count: property.bedrooms })}</span>
          <span>·</span>
          <span>{tProperty('areaLabel', { n: property.areaSqm })}</span>
          {property.floor && (
            <>
              <span>·</span>
              <span>{tProperty('floorLabel', { n: property.floor, total: property.totalFloors ?? property.floor })}</span>
            </>
          )}
          {property.code && (
            <span className="ml-auto font-mono text-[10px] tracking-[0.2em] text-muted/60">
              {property.code}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Stacked images that cross-fade. Only the active one is opaque.
 *  The cover (index 0) honours coverFocus/coverZoom — set in the admin crop UI. */
function ImageStack({
  images,
  activeIndex,
  coverFocus,
  coverZoom,
}: {
  images: string[];
  activeIndex: number;
  coverFocus?: string;
  coverZoom?: number;
}) {
  const zoom = coverZoom && Number.isFinite(coverZoom) ? coverZoom : 1;
  const position = coverFocus || '50% 50%';
  return (
    <>
      {images.map((src, i) => {
        const isCover = i === 0;
        const isActive = i === activeIndex;
        // sizes — подсказка браузеру: ширина картинки на разных вьюпортах.
        // Этого достаточно чтобы Next.js отдавал нужный размер из srcset,
        // вместо полноразмерного оригинала.
        const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px';
        return (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes={sizes}
            priority={isCover && isActive}
            loading={isCover && isActive ? undefined : 'lazy'}
            className="object-cover transition-opacity duration-[888ms] ease-in-out"
            style={{
              opacity: isActive ? 1 : 0,
              objectPosition: isCover ? position : '50% 50%',
              transform: isCover ? `scale(${zoom})` : undefined,
              transformOrigin: isCover ? position : undefined,
            }}
            aria-hidden={!isActive}
          />
        );
      })}
    </>
  );
}

/** Tiny dots overlay showing how many photos are in the gallery. */
function ImageDots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <div className="absolute bottom-3 right-3 z-[2] flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-1 w-4 rounded-full transition-colors duration-500 ${
            i === active ? 'bg-cream' : 'bg-cream/40'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
