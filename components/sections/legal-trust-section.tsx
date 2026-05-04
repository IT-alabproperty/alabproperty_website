'use client';

import { motion } from 'framer-motion';
import { Building2, ShieldCheck, ListChecks, Receipt, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Eyebrow } from '@/components/ui/eyebrow';

type CardKey = 'ownership' | 'dueDiligence' | 'transaction' | 'tax' | 'crypto';

const CARD_KEYS: CardKey[] = ['ownership', 'dueDiligence', 'transaction', 'tax', 'crypto'];

const ICONS: Record<CardKey, React.ElementType> = {
  ownership: Building2,
  dueDiligence: ShieldCheck,
  transaction: ListChecks,
  tax: Receipt,
  crypto: Wallet,
};

const ease = [0.16, 1, 0.3, 1] as const;

export function LegalTrustSection() {
  const t = useTranslations('LegalTrust');

  return (
    <section className="relative overflow-hidden bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pb-40 sm:pt-40 lg:px-14">

      {/* faint background watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-80px] top-[-60px] select-none font-serif text-[320px] font-light leading-none text-teak/[0.03]"
      >
        §
      </div>

      <div className="relative mx-auto max-w-[1200px]">

        {/* ── HEADER ── */}
        <motion.div
          className="mb-20 max-w-[640px]"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, ease }}
        >
          <Eyebrow className="mb-8">{t('eyebrow')}</Eyebrow>

          <h2 className="mb-7 font-serif text-[clamp(36px,5vw,62px)] font-normal leading-[1.06] text-ink">
            {t('titleLine1')}
            <br />
            <em className="font-light italic text-gold-deep">{t('titleLine2Em')}</em>
          </h2>

          <p className="max-w-[500px] text-[16px] leading-[1.75] text-muted">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* ── CARD GRID ── */}
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
          {CARD_KEYS.map((key, i) => {
            const Icon = ICONS[key];
            return (
              <motion.div
                key={key}
                className="group relative flex flex-col bg-paper p-8 lg:p-10"
                initial={{ opacity: 0, y: 44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.75, ease, delay: i * 0.1 }}
              >
                {/* hover gold top border */}
                <div className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gold-deep transition-transform duration-500 group-hover:scale-x-100" />

                {/* icon */}
                <div className="mb-7 inline-flex h-11 w-11 items-center justify-center border border-line bg-cream-warm text-gold-deep transition-colors duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
                  <Icon size={18} strokeWidth={1.4} />
                </div>

                {/* eyebrow tag */}
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-gold-deep">
                  {t(`cards.${key}.tag`)}
                </p>

                {/* title */}
                <h3 className="mb-4 font-serif text-[21px] font-normal leading-[1.2] text-ink">
                  {t(`cards.${key}.title`)}
                </h3>

                {/* gold rule */}
                <div className="mb-5 h-px w-8 bg-gold/40 transition-all duration-500 group-hover:w-14 group-hover:bg-gold-deep" />

                {/* body */}
                <p className="flex-1 text-[13px] leading-[1.75] text-muted">
                  {t(`cards.${key}.body`)}
                </p>

                {/* bottom note */}
                <p className="mt-7 text-[10px] uppercase tracking-[0.18em] text-ink/25">
                  {t(`cards.${key}.note`)}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── BOTTOM CALLOUT ── */}
        <motion.div
          className="mt-px bg-teak-deep px-8 py-8 sm:flex sm:items-center sm:justify-between sm:px-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.8, ease, delay: 0.35 }}
        >
          <p className="font-serif text-[17px] font-light italic text-cream/80 sm:text-[19px]">
            "{t('quote')}"
          </p>
          <a
            href="/legal"
            className="mt-5 inline-flex shrink-0 items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-gold transition-colors hover:text-cream sm:ml-12 sm:mt-0"
          >
            {t('legalGuideLink')}
            <span aria-hidden="true" className="text-[10px]">→</span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}
