import { Link } from '@/lib/i18n/routing';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');
  const tPrivacy = useTranslations('Privacy');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink px-6 pb-10 pt-16 text-xs tracking-tight text-cream/60 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1200px]">
        {/* Top row */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-cream/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="font-serif text-xl tracking-[0.18em] text-cream">
              ALAB <span className="italic text-gold">Property</span>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cream/40">
              {t('consultNote')}
            </div>
          </div>
          <div className="flex flex-col items-start gap-1.5 text-[11px] sm:items-end">
            <span className="uppercase tracking-[0.14em] text-cream/50">{t('nativeLanguage')}</span>
            <span className="uppercase tracking-[0.14em] text-cream/50">{t('businessInvest')}</span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div>{t('copyright', { year })}</div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/privacy"
              className="uppercase tracking-[0.14em] text-cream/50 transition-colors hover:text-gold"
            >
              {tPrivacy('footerLink')}
            </Link>
            <span className="text-center sm:text-right">{t('tagline')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
