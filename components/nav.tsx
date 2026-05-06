'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Menu, X } from 'lucide-react';
import { CurrencySwitcher } from './currency-switcher';
import { LanguageSwitcher } from './language-switcher';
import { MobileCurrencyPill } from './mobile-currency-pill';
import { useProposalModal } from './proposal-modal';

export function Nav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const isHome = /^\/(ru|en)?\/?$/.test(pathname);
  const [scrolled, setScrolled] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // lock body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const { open: openModal } = useProposalModal();

  if (pathname.startsWith('/gate')) return null;

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/properties', label: t('properties') },
    { href: '/business', label: t('business'), mobileLabel: t('businessFull') },
    { href: '/blog', label: t('blog') },
    { href: '/legal', label: t('legal') },
  ];

  return (
    <>
      <nav
        data-scrolled={scrolled}
        className="alab-nav fixed inset-x-0 top-0 z-[100] grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b px-4 py-3 backdrop-blur-xl transition-[background-color,border-color] duration-500 sm:gap-8 sm:px-10 sm:py-[18px]"
      >
        <Link href="/" className="alab-logo whitespace-nowrap font-serif text-[18px] font-medium tracking-[0.12em] transition-colors duration-500 sm:text-[22px] sm:tracking-[0.16em]">
          ALAB <span className="alab-logo-mark italic font-normal">Property</span>
        </Link>

        {/* desktop links - hidden on mobile */}
        <ul className="alab-nav-links hidden justify-self-center gap-6 list-none lg:flex xl:gap-8">
          {navLinks.map((l) => (
            <li key={l.href} className={l.href === '/contacts' ? 'hidden xl:block' : ''}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>

        {/* spacer for mobile */}
        <div className="lg:hidden" />

        <div className="flex items-center justify-self-end gap-1.5 sm:gap-2.5">
          {/* Currency: hidden on small screens (also available in search bar) */}
          <div className="hidden sm:block">
            <CurrencySwitcher />
          </div>
          <LanguageSwitcher />

          {/* Desktop: full text CTA */}
          <button
            type="button"
            onClick={() => openModal()}
            className="alab-nav-cta hidden whitespace-nowrap rounded-full px-[18px] py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-all duration-400 sm:inline-flex"
          >
            {t('getOffer')}
          </button>

          {/* Mobile: currency pill */}
          <MobileCurrencyPill scrolled={scrolled} />

          {/* Mobile: icon-only CTA */}
          <button
            type="button"
            onClick={() => openModal()}
            aria-label={t('getOffer')}
            className="alab-nav-cta-icon flex h-9 w-9 items-center justify-center rounded-full transition-all duration-400 sm:hidden"
          >
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </button>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="alab-nav-burger flex h-9 w-9 items-center justify-center rounded-full transition-all duration-400 lg:hidden"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        data-open={menuOpen}
        className="alab-mobile-menu fixed inset-0 z-[200] flex flex-col bg-teak-deep p-6 text-cream"
      >
        <div className="flex items-center justify-between">
          <div className="font-serif text-[20px] font-medium tracking-[0.14em] text-cream">
            ALAB <span className="italic font-normal text-gold">Property</span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:bg-cream/10"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <ul className="mt-8 flex-1 overflow-y-auto flex flex-col gap-0 list-none">
          {navLinks.map((l, i) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 font-serif text-[32px] font-normal text-cream transition-colors hover:text-gold"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                {'mobileLabel' in l ? l.mobileLabel : l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); openModal(); }}
            className="rounded-full bg-gold px-6 py-4 text-xs font-medium uppercase tracking-[0.16em] text-teak-deep transition-all duration-400 hover:bg-cream"
          >
            {t('getOffer')}
          </button>
        </div>
      </div>
    </>
  );
}
