'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Eyebrow } from '@/components/ui/eyebrow';
import { useProposalModal } from '@/components/proposal-modal';

export function FinalCtaSection() {
  const t = useTranslations('FinalCta');
  const { open: openModal } = useProposalModal();

  return (
    <section className="relative overflow-hidden bg-teak-deep px-6 py-32 text-center text-cream sm:px-10 sm:py-40 lg:px-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,97,0.12)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-[760px]">
        <div className="mb-10 flex justify-center">
          <Eyebrow variant="dark">{t('tag')}</Eyebrow>
        </div>
        <h2 className="mb-8 font-serif text-[clamp(44px,5.5vw,80px)] font-normal leading-[1.05] tracking-[-0.02em]">
          {t('titleLine1')}
          <br />
          <em className="font-light italic text-gold">{t('titleLine2Em')}</em> {t('titleLine2')}
        </h2>
        <p className="mx-auto mb-12 max-w-[520px] text-[17px] leading-[1.65] text-cream/70">{t('description')}</p>
        <button
          type="button"
          onClick={() => openModal()}
          className="group inline-flex items-center gap-3 rounded-full bg-gold px-10 py-5 text-[13px] font-medium uppercase tracking-[0.16em] text-teak-deep transition-all duration-500 hover:-translate-y-0.5 hover:bg-cream hover:shadow-[0_16px_40px_rgba(201,169,97,0.3)]"
        >
          {t('cta')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-400 group-hover:translate-x-1" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
