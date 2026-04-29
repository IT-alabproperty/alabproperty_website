import { useTranslations } from 'next-intl';
import { SearchBar } from '@/components/search-bar';
import { Eyebrow } from '@/components/ui/eyebrow';

export function SearchSection() {
  const t = useTranslations('SearchSection');

  return (
    <section className="relative bg-cream-warm px-6 pb-20 pt-20 sm:px-10 sm:pb-24 sm:pt-24 lg:px-14">
      <div className="mx-auto mb-12 max-w-[1240px] text-center sm:mb-14">
        <div className="alab-reveal flex justify-center">
          <Eyebrow>{t('tag')}</Eyebrow>
        </div>
        <h2 className="alab-reveal mt-8 font-serif text-[clamp(28px,3.5vw,44px)] font-normal leading-[1.15] tracking-[-0.01em] text-teak-deep">
          {t('title')} <em className="font-light italic text-gold-deep">{t('titleEm')}</em>
        </h2>
      </div>
      <div className="alab-reveal">
        <SearchBar />
      </div>
    </section>
  );
}
