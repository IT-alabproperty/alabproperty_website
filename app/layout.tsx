import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter_Tight } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { CurrencyProvider } from '@/components/currency-context';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { ScrollRevealMount } from '@/components/scroll-reveal';
import { LoadingScreen } from '@/components/loading-screen';
import { ProposalModalProvider } from '@/components/proposal-modal';
import type { Locale } from '@/lib/types';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ALAB Property · Real Estate & Legal Counsel in Bangkok',
  description:
    'Premium real estate in Bangkok with full legal support. Bilingual transaction handling in Russian and English.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${cormorant.variable} ${interTight.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CurrencyProvider locale={locale}>
            <ProposalModalProvider>
              <LoadingScreen />
              <div className="alab-wood-texture" aria-hidden="true" />
              <div className="alab-grain" aria-hidden="true" />
              <Nav />
              {children}
              <Footer />
              <ScrollRevealMount />
            </ProposalModalProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
