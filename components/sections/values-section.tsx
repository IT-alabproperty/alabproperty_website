import { useTranslations } from 'next-intl';
import { Eyebrow } from '@/components/ui/eyebrow';

const VALUES_IMAGE = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=85';

export function ValuesSection() {
  const t = useTranslations('Values');

  const items = [
    { num: 'I', titleKey: 'items.item1Title', descKey: 'items.item1Desc' },
    { num: 'II', titleKey: 'items.item2Title', descKey: 'items.item2Desc' },
    { num: 'III', titleKey: 'items.item3Title', descKey: 'items.item3Desc' },
    { num: 'IV', titleKey: 'items.item4Title', descKey: 'items.item4Desc' },
  ];

  return (
    <section className="relative bg-gradient-to-b from-paper to-cream-warm px-6 py-32 sm:px-10 sm:py-40 lg:px-14">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <div
          className="alab-reveal relative aspect-[4/5] overflow-hidden rounded bg-cover bg-center"
          style={{ backgroundImage: `url(${VALUES_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-teak-deep/20 to-teak-deep/60" />
          <div className="absolute bottom-8 left-8 z-[2] font-serif text-lg italic tracking-tight text-cream">
            {t('imageLabel')}
          </div>
        </div>

        <div className="alab-reveal lg:pl-4">
          <Eyebrow className="mb-10">{t('tag')}</Eyebrow>
          <h2 className="mb-12 font-serif text-[clamp(36px,4.5vw,60px)] font-normal leading-[1.05] tracking-[-0.02em] text-teak-deep">
            {t('titleLine1')}
            <br />
            <em className="font-light italic text-gold-deep">{t('titleLine2Em')}</em> {t('titleLine2')}
          </h2>

          <ul className="list-none">
            {items.map((item, i) => (
              <li
                key={item.num}
                className={`grid grid-cols-[auto_1fr] items-start gap-8 py-6 ${
                  i < items.length - 1 ? 'border-b border-[var(--line)]' : ''
                }`}
              >
                <div className="font-serif text-xl italic text-gold-deep">{item.num}</div>
                <div>
                  <h3 className="mb-1.5 font-serif text-2xl font-normal text-teak-deep">{t(item.titleKey)}</h3>
                  <p className="text-sm leading-[1.6] text-teak-warm">{t(item.descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
