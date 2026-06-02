import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Mail, MapPin } from 'lucide-react';
import { ContactForm } from '@/components/property/contact-form';
import { buildMetadata } from '@/lib/seo';
import type { Locale } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: 'SEO' });
  return buildMetadata({
    locale,
    title: t('pages.contacts.title'),
    description: t('pages.contacts.description'),
    path: '/contacts',
  });
}

export default async function ContactsPage() {
  const locale = (await getLocale()) as Locale;
  const isRu = locale === 'ru';

  return (
    <main className="min-h-screen bg-paper px-6 pb-24 pt-36 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1100px]">
        {/* Page header */}
        <header className="mb-14 max-w-[640px] alab-reveal">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-deep">
            {isRu ? 'Контакты' : 'Contact'}
          </p>
          <h1 className="font-serif text-[clamp(36px,6vw,64px)] font-light leading-[1.05] tracking-[-0.02em] text-teak-deep">
            {isRu ? 'Свяжитесь с нами' : 'Get in touch'}
          </h1>
          <p className="mt-6 max-w-[480px] text-[16px] leading-[1.6] text-teak-warm">
            {isRu
              ? 'Оставьте заявку — юридический консультант ALAB свяжется с вами в течение 12 часов, чтобы обсудить детали и ответить на вопросы.'
              : 'Send us a message — an ALAB legal consultant will reach out within 12 hours to discuss your enquiry and answer any questions.'}
          </p>
        </header>

        {/* Two columns: form (left) + direct contacts (right) */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Left — the same ContactForm used on property pages, just without a
              property prop. /api/leads handles property-less submissions. */}
          <div className="alab-reveal">
            <ContactForm />
          </div>

          {/* Right — direct contact details (so people who prefer email/phone
              still see them without scrolling). */}
          <aside className="alab-reveal space-y-8 lg:pt-2">
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-deep">
                {isRu ? 'Офис' : 'Office'}
              </p>
              <p className="flex items-start gap-3 text-[15px] leading-[1.6] text-teak">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.5} />
                Bangkok, Thailand
              </p>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gold-deep">
                Email
              </p>
              <p className="flex items-start gap-3 text-[15px] leading-[1.6]">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.5} />
                <a
                  href="mailto:property@alabproperty.com"
                  className="text-teak transition-colors hover:text-gold-deep"
                >
                  property@alabproperty.com
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-cream/50 p-5">
              <p className="text-[13px] leading-[1.6] text-teak-warm">
                {isRu
                  ? 'Юридические вопросы по сделкам ведёт A.L.A.B Consultant Co., Ltd. — наша аффилированная юридическая фирма.'
                  : 'Legal matters around transactions are handled by A.L.A.B Consultant Co., Ltd. — our affiliated law firm.'}{' '}
                <a
                  href="https://alabconsultant.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-deep underline-offset-4 hover:underline"
                >
                  alabconsultant.com
                </a>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
