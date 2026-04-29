import { useTranslations } from 'next-intl';
import { Eyebrow } from '@/components/ui/eyebrow';

export function GuaranteeSection() {
  const t = useTranslations('Guarantee');

  const stages: Array<{ num: string; titleKey: string; descKey: string }> = [
    { num: 'I', titleKey: 'stages.stage1Title', descKey: 'stages.stage1Desc' },
    { num: 'II', titleKey: 'stages.stage2Title', descKey: 'stages.stage2Desc' },
    { num: 'III', titleKey: 'stages.stage3Title', descKey: 'stages.stage3Desc' },
    { num: 'IV', titleKey: 'stages.stage4Title', descKey: 'stages.stage4Desc' },
  ];

  return (
    <section id="guarantee" className="alab-guarantee-bg relative overflow-hidden bg-teak-deep px-6 pb-32 pt-32 text-cream sm:px-10 sm:pb-40 sm:pt-40 lg:px-14 lg:pt-44">
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
        <div className="alab-reveal">
          <Eyebrow variant="dark" className="mb-10">
            {t('tag')}
          </Eyebrow>
          <h2 className="mb-10 font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[1.05]">
            {t('titleLine1')}
            <br />
            {t('titleLine2')} <em className="font-light italic text-gold">{t('titleLine2Em')}</em>
          </h2>
          <p className="max-w-[500px] text-[17px] leading-[1.7] text-cream/75">{t('description')}</p>
        </div>

        <div className="alab-reveal text-center">
          <div className="relative inline-block font-serif text-[clamp(140px,18vw,260px)] font-light leading-[0.9] tracking-[-0.04em] text-gold">
            100
            <span className="absolute right-[-0.4em] top-[0.1em] text-[0.4em] font-light italic text-cream">%</span>
          </div>
          <div className="mt-4 text-[13px] uppercase tracking-[0.2em] text-cream/60">{t('statLabel')}</div>
        </div>
      </div>

      <div className="alab-reveal mx-auto mt-28 grid max-w-[1200px] grid-cols-2 gap-px bg-cream/10 lg:grid-cols-4">
        {stages.map((s) => (
          <div key={s.num} className="bg-teak-deep p-9 transition-colors duration-500 hover:bg-teak">
            <div className="mb-5 font-serif text-sm italic tracking-tight text-gold">{s.num}</div>
            <div className="mb-2.5 font-serif text-[22px] font-normal text-cream">{t(s.titleKey)}</div>
            <div className="text-[13px] leading-[1.6] text-cream/55">{t(s.descKey)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
