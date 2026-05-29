import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Eyebrow } from '@/components/ui/eyebrow';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.privacy.title'),
    description: t('pages.privacy.description'),
    path: '/privacy',
  });
}

type Section = {
  title: string;
  body: string;
};

const SECTION_KEYS = [
  'collect',
  'purpose',
  'processors',
  'cookies',
  'retention',
  'rights',
  'contact',
] as const;

export default async function PrivacyPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('Privacy');

  const lastUpdatedDate = new Date('2026-05-26').toLocaleDateString(
    locale === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const sections: Section[] = SECTION_KEYS.map((key) => ({
    title: t(`sections.${key}.title`),
    body: t(`sections.${key}.body`),
  }));

  return (
    <main className="min-h-screen bg-paper px-6 pb-32 pt-32 sm:px-10 sm:pt-40 lg:px-14">
      <article className="mx-auto max-w-[820px]">
        <header className="mb-16 alab-reveal">
          <Eyebrow className="mb-8">{t('eyebrow')}</Eyebrow>
          <h1 className="font-serif text-[clamp(36px,4.5vw,56px)] font-normal leading-[1.08] tracking-[-0.02em] text-teak-deep">
            {t('title')}
          </h1>
          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            {t('lastUpdated', { date: lastUpdatedDate })}
          </p>
        </header>

        <div className="space-y-14">
          <section className="alab-reveal">
            <p className="text-[15px] leading-[1.75] text-teak-warm whitespace-pre-line">
              {t('intro')}
            </p>
          </section>

          {sections.map((s) => (
            <section key={s.title} className="alab-reveal">
              <h2 className="mb-5 font-serif text-[clamp(22px,2.5vw,30px)] font-normal leading-[1.2] text-teak-deep">
                {s.title}
              </h2>
              <p className="text-[15px] leading-[1.75] text-teak-warm whitespace-pre-line">
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
