import type { Metadata } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Locale } from '@/lib/types';
import { LegalTrustSection } from '@/components/sections/legal-trust-section';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  // Hidden from nav + sitemap while copy is being finalised. See nav.tsx note.
  return buildMetadata({
    locale,
    title: t('pages.legal.title'),
    description: t('pages.legal.description'),
    path: '/legal',
    noindex: true,
  });
}

export default function LegalPage() {
  const t = useTranslations('Nav');
  const locale = useLocale() as Locale;

  return (
    <main>
      <LegalTrustSection />

      {/* <div className="px-6 pb-32 pt-20 sm:px-10 lg:px-14"> */}
        {/* <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-12 font-serif text-[clamp(32px,4vw,48px)] font-normal tracking-[-0.02em] text-teak-deep">
            {t('legal')}
          </h2>
          <ul className="space-y-8">
            {mockArticles.map((a) => (
              <li key={a.id} className="border-b border-[var(--line)] pb-8">
                <Link href={`/legal/${a.slug}`} className="group block">
                  <div className="text-xs uppercase tracking-[0.18em] text-gold-deep">{a.category}</div>
                  <h3 className="mt-2 font-serif text-3xl font-normal text-teak-deep transition-colors group-hover:text-gold-deep">
                    {a.title[locale]}
                  </h3>
                  <p className="mt-3 text-base leading-[1.6] text-teak-warm">{a.excerpt[locale]}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div> */}
      {/* </div> */}
    </main>
  );
}
