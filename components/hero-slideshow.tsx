'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useProposalModal } from '@/components/proposal-modal';

// True after first mount — skip intro animations on client-side navigation.
let heroFirstLoadDone = false;

const slides = [
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=2400&q=85',
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=2400&q=85',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=2400&q=85',
  'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=2400&q=85',
];

export function HeroSlideshow() {
  const t = useTranslations('Hero');
  const { open: openModal } = useProposalModal();
  const [active, setActive] = useState(0);
  // Skip intro animations on client-side navigation (not first page load).
  const [skipAnim, setSkipAnim] = useState(false);
  useEffect(() => {
    if (heroFirstLoadDone) setSkipAnim(true);
    heroFirstLoadDone = true;
  }, []);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slide auto-advance.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 11000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Restart Ken Burns animation each time a slide becomes active.
  // CSS animations don't auto-restart when the same element gains the trigger
  // class again, so we force a reflow by removing/reapplying the animation.
  useEffect(() => {
    const el = slideRefs.current[active];
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth; // trigger reflow
    el.style.animation = '';
  }, [active]);

  const goTo = (i: number) => {
    setActive(i);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActive((prev) => (prev + 1) % slides.length);
      }, 11000);
    }
  };

  return (
    <section className="relative h-screen min-h-[720px] overflow-hidden text-cream">
      {/* slides container */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="alab-hero-slide"
            data-active={i === active}
            style={{ backgroundImage: `url(${src})` }}
            aria-hidden={i !== active}
          />
        ))}
      </div>

      {/* content */}
      <div className="relative z-[5] flex h-full flex-col justify-between px-6 pb-20 pt-[120px] sm:px-10 sm:pt-[140px] lg:px-14">
        {/* meta - hidden on mobile to save space, visible from sm */}
        <div className={`${skipAnim ? '' : 'alab-fade-in'} hidden items-center justify-between text-[11px] uppercase tracking-[0.2em] text-cream/70 sm:flex`} style={skipAnim ? undefined : { animationDelay: '0.3s' }}>
          <span>{t('meta')}</span>
          <div className="mx-8 h-px flex-1 bg-cream/20" />
          <span>{t('metaSub')}</span>
        </div>

        {/* main */}
        <div className="mx-auto sm:mt-16 grid w-full max-w-[1200px] grid-cols-1 items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <h1 className="font-serif text-[clamp(56px,7.5vw,116px)] font-normal leading-[0.95] tracking-[-0.02em] text-cream">
            <div className={skipAnim ? undefined : 'alab-hero-title-line'}>
              <span>{t('titleLine1')}</span>
            </div>
            <div className={skipAnim ? undefined : 'alab-hero-title-line'}>
              <span>{t('titleLine2')}</span>
            </div>
            <div className={skipAnim ? undefined : 'alab-hero-title-line'}>
              <span className="italic font-light text-gold">{t('titleLine3')}</span>
            </div>
          </h1>

          <div className={`${skipAnim ? '' : 'alab-fade-in'} pb-2`} style={skipAnim ? undefined : { animationDelay: '1.4s' }}>
            <Eyebrow variant="dark" className="mb-8">
              {t('tag')}
            </Eyebrow>
            <p className="mb-8 max-w-[380px] text-[17px] leading-[1.65] text-cream/85">
              {t('description')}
            </p>
            <div className="flex gap-3 sm:flex-wrap sm:gap-4">
              <button
                type="button"
                onClick={() => openModal()}
                className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-gold px-5 py-4 text-[12px] font-medium uppercase tracking-[0.14em] text-teak-deep transition-all duration-500 hover:-translate-y-0.5 hover:bg-cream hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:flex-initial sm:px-8 sm:py-[18px] sm:text-[13px] sm:tracking-[0.16em]"
              >
                {t('ctaPrimary')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-400 group-hover:translate-x-1" strokeWidth={1.5} />
              </button>
              <Link
                href="/properties"
                className="flex-1 rounded-full border border-cream/40 bg-transparent px-5 py-4 text-[12px] uppercase tracking-[0.14em] text-cream transition-all duration-500 hover:border-cream hover:bg-cream hover:text-teak-deep sm:flex-initial sm:px-8 sm:py-[18px] sm:text-[13px] sm:tracking-[0.16em]"
              >
                {t('ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* slide dots - desktop only */}
      <div className={`${skipAnim ? '' : 'alab-fade-in'} absolute bottom-10 right-14 z-[6] hidden gap-2.5 sm:flex`} style={skipAnim ? undefined : { animationDelay: '2s' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === active}
            className={`h-px w-9 cursor-pointer border-none p-0 transition-colors duration-400 ${
              i === active ? 'bg-gold' : 'bg-cream/30'
            }`}
            style={{ height: '2px' }}
          />
        ))}
      </div>
    </section>
  );
}
