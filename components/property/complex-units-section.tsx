'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import type { Locale, PropertyUnit } from '@/lib/types'

export function ComplexUnitsSection({
  units,
  floorplanImage,
}: {
  units: PropertyUnit[]
  floorplanImage?: string
}) {
  const locale = useLocale() as Locale
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const selected = units[selectedIdx]

  return (
    <section>
      <Eyebrow className="mb-6">
        {locale === 'ru' ? 'Типы юнитов' : 'Unit Types'}
      </Eyebrow>
      <h2 className="mb-8 font-serif text-3xl font-normal text-teak-deep sm:text-4xl">
        {locale === 'ru' ? 'Выберите планировку' : 'Choose Your Layout'}
      </h2>

      {/* {floorplanImage && (
        <div className="mb-10 overflow-hidden rounded-xl border border-[var(--line)]">
          <img src={floorplanImage} alt="Floor plan" className="w-full" />
        </div>
      )} */}

      {/* Unit type tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {units.map((unit, i) => (
          <button
            key={unit.id}
            onClick={() => setSelectedIdx(i)}
            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
              i === selectedIdx
                ? 'border-gold bg-gold/10 text-gold-deep'
                : 'border-[var(--line-strong)] text-muted hover:border-gold/40 hover:text-teak'
            }`}
          >
            {unit.name[locale]}
            {unit.status === 'sold-out' ? (
              <span className="ml-2 text-xs text-red-400">
                {locale === 'ru' ? 'Распродано' : 'Sold out'}
              </span>
            ) : (
              <span className="ml-2 text-xs text-muted">
                ({unit.availableUnits})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected unit details */}
      {selected && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Unit gallery — small thumbnails */}
          {selected.gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selected.gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className="relative aspect-square overflow-hidden rounded-lg transition-opacity hover:opacity-90"
                >
                  <img
                    src={img}
                    alt={`${selected.name[locale]} ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Unit info */}
          <div>
            <h3 className="font-serif text-2xl font-normal text-teak-deep">
              {selected.name[locale]}
            </h3>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {selected.priceThb && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                    {locale === 'ru' ? 'Цена от' : 'Price from'}
                  </p>
                  <p className="mt-1 font-serif text-xl text-teak-deep">
                    ฿{selected.priceThb.toLocaleString()}
                  </p>
                </div>
              )}
              {selected.areaSqm && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                    {locale === 'ru' ? 'Площадь' : 'Area'}
                  </p>
                  <p className="mt-1 font-serif text-xl text-teak-deep">
                    {selected.areaSqm} m²
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  {locale === 'ru' ? 'Спальни' : 'Bedrooms'}
                </p>
                <p className="mt-1 font-serif text-xl text-teak-deep">
                  {selected.bedrooms}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  {locale === 'ru' ? 'Ванные' : 'Bathrooms'}
                </p>
                <p className="mt-1 font-serif text-xl text-teak-deep">
                  {selected.bathrooms}
                </p>
              </div>
              {selected.floorRange && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                    {locale === 'ru' ? 'Этажи' : 'Floors'}
                  </p>
                  <p className="mt-1 font-serif text-xl text-teak-deep">
                    {selected.floorRange}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  {locale === 'ru' ? 'Доступно' : 'Available'}
                </p>
                <p
                  className={`mt-1 font-serif text-xl ${
                    selected.status === 'sold-out'
                      ? 'text-red-400'
                      : 'text-teak-deep'
                  }`}
                >
                  {selected.status === 'sold-out'
                    ? locale === 'ru'
                      ? 'Распродано'
                      : 'Sold out'
                    : selected.availableUnits}
                </p>
              </div>
            </div>

            {selected.description &&
              (selected.description[locale] || selected.description.ru) && (
                <p className="mt-8 text-[17px] leading-[1.85] text-teak-warm">
                  {selected.description[locale] || selected.description.ru}
                </p>
              )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && selected && (
        <UnitLightbox
          images={selected.gallery}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </section>
  )
}

function UnitLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const isCurrentLoaded = loaded.has(images[index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
          aria-label="Previous"
          className="absolute left-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>
      )}

      <div className="relative flex h-[80vh] w-[90vw] max-w-[1400px] items-center justify-center overflow-hidden rounded-3xl bg-ink/40 shadow-2xl shadow-black/40">
        {!isCurrentLoaded && (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream/30 border-t-gold" />
          </div>
        )}
        <img
          key={images[index]}
          src={images[index]}
          alt={`Photo ${index + 1}`}
          className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${isCurrentLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => {
            const src = images[index]
            setLoaded((prev) => {
              if (prev.has(src)) return prev
              const next = new Set(prev)
              next.add(src)
              return next
            })
          }}
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % images.length)}
          aria-label="Next"
          className="absolute right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
        </button>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-cream/70">
        {index + 1} / {images.length}
      </div>
    </div>
  )
}
