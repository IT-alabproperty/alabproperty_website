'use client';

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/lib/types';

// ─── types ───────────────────────────────────────────────────────────────────

export interface ProposalProperty {
  id: string;
  slug: string;
  name: { en: string; ru: string };
}

interface ModalState { isOpen: boolean; property?: ProposalProperty }
interface ModalCtx   { open: (p?: ProposalProperty) => void; close: () => void }

// ─── context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<ModalCtx>({ open: () => {}, close: () => {} });
export const useProposalModal = () => useContext(Ctx);

// ─── provider ────────────────────────────────────────────────────────────────

export function ProposalModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>({ isOpen: false });

  const open  = useCallback((property?: ProposalProperty) => setState({ isOpen: true, property }), []);
  const close = useCallback(() => setState(s => ({ ...s, isOpen: false })), []);

  // ESC to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [close]);

  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = state.isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [state.isOpen]);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {state.isOpen && <ProposalModal property={state.property} onClose={close} />}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

// ─── modal shell ─────────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

function ProposalModal({ property, onClose }: { property?: ProposalProperty; onClose: () => void }) {
  const tHero = useTranslations('Hero');
  const locale = useLocale() as Locale;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[1200] bg-ink/65 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel wrapper — handles centering */}
      <div className="fixed inset-0 z-[1201] flex items-end sm:items-center justify-center sm:p-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          className="relative flex w-full max-w-[980px] max-h-[96dvh] overflow-hidden bg-paper shadow-[0_40px_100px_rgba(26,15,8,0.5)] sm:rounded-xl"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.48, ease }}
          onClick={e => e.stopPropagation()}
          style={{ flexDirection: 'row' }}
        >
          {/* ── Left brand panel (desktop only) ── */}
          <div className="hidden sm:flex flex-col justify-between w-[280px] lg:w-[320px] shrink-0 bg-teak-deep p-10 text-cream">
            {/* Logo */}
            <div>
              <div className="font-serif text-[21px] font-medium tracking-[0.16em]">
                ALAB <span className="italic font-normal text-gold">Property</span>
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-cream/35">
                Bangkok · Thailand
              </div>
            </div>

            {/* Property badge */}
            {property && (
              <div className="my-auto py-8 border-t border-b border-cream/10">
                <p className="text-[9px] uppercase tracking-[0.25em] text-gold mb-3">
                  {locale === 'ru' ? 'Вас интересует' : 'Your interest'}
                </p>
                <p className="font-serif text-[20px] font-normal leading-[1.25] text-cream">
                  {property.name[locale] ?? property.name.en}
                </p>
                <div className="mt-3 h-px w-6 bg-gold/50" />
              </div>
            )}

            {/* Tagline */}
            <div className={property ? '' : 'mt-auto'}>
              <p className="font-serif text-[15px] italic font-light leading-[1.65] text-cream/55">
                "{tHero('description')}"
              </p>
              <div className="mt-5 h-px w-7 bg-gold/40" />
              <p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-cream/25">
                ALAB Consult · Est. 2018
              </p>
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/8 text-muted transition-colors hover:bg-ink/15 hover:text-teak"
              aria-label="Close"
            >
              <X className="h-[15px] w-[15px]" strokeWidth={1.75} />
            </button>

            <ModalForm property={property} onClose={onClose} />
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── form ─────────────────────────────────────────────────────────────────────

interface FormData {
  name: string; email: string; phone: string;
  message: string; preferredContact: 'email' | 'phone' | 'whatsapp';
}
interface FormErrors { name?: string; email?: string; phone?: string }

const blank: FormData = { name: '', email: '', phone: '', message: '', preferredContact: 'email' };

function ModalForm({ property, onClose }: { property?: ProposalProperty; onClose: () => void }) {
  const t      = useTranslations('Contact');
  const tHero  = useTranslations('Hero');
  const locale = useLocale() as Locale;

  const [data, setData]           = useState<FormData>(blank);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]  = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  const propertyName = property ? (property.name[locale] ?? property.name.en) : null;
  const defaultMsg   = propertyName
    ? t('defaultMessage', { name: propertyName })
    : (locale === 'ru' ? 'Здравствуйте, хочу узнать больше о ваших объектах и условиях сотрудничества.' : 'Hello, I would like to learn more about your properties and cooperation terms.');

  // focus first field on open
  useEffect(() => { firstRef.current?.focus(); }, []);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData(d => ({ ...d, [key]: value }));
    if (key in errors) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!data.name.trim() || data.name.trim().length < 2) errs.name  = t('errors.nameRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))  errs.email = t('errors.emailInvalid');
    if (data.phone && !/^[+\d\s()-]{6,}$/.test(data.phone)) errs.phone = t('errors.phoneInvalid');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      ...data,
      message: data.message.trim() || defaultMsg,
      propertyId:   property?.id   ?? null,
      propertySlug: property?.slug ?? null,
      submittedAt:  new Date().toISOString(),
    };
    console.log('[ALAB lead]', payload);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  // ── success state ──
  if (submitted) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 px-8 py-16 text-center">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold-deep"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease }}
        >
          <Check className="h-7 w-7" strokeWidth={1.4} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.15 }}
        >
          <h3 className="font-serif text-[32px] font-normal text-teak-deep">{t('successTitle')}</h3>
          <p className="mx-auto mt-3 max-w-[340px] text-[14px] leading-[1.7] text-muted">{t('successDesc')}</p>
        </motion.div>
        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            type="button"
            onClick={() => { setSubmitted(false); setData(blank); }}
            className="text-[11px] uppercase tracking-[0.16em] text-muted underline-offset-4 transition-colors hover:text-gold-deep hover:underline"
          >
            {t('sendAnother')}
          </button>
          <span className="text-muted/40">·</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.16em] text-muted underline-offset-4 transition-colors hover:text-gold-deep hover:underline"
          >
            {locale === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── form ──
  return (
    <form onSubmit={onSubmit} noValidate className="px-6 py-8 sm:px-10 sm:py-10">
      {/* Header */}
      <div className="mb-8 pr-8">
        {/* mobile property badge */}
        {propertyName && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/8 px-3 py-1.5 sm:hidden">
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold-deep">{propertyName}</span>
          </div>
        )}
        <h3 className="font-serif text-[28px] sm:text-[32px] font-normal leading-[1.1] text-teak-deep">
          {t('title')}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.6] text-muted">{t('subtitle')}</p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MField label={t('name')} required error={errors.name}>
          <input
            ref={firstRef}
            type="text"
            value={data.name}
            onChange={e => update('name', e.target.value)}
            placeholder={t('namePlaceholder')}
            className="mfield-input"
            autoComplete="name"
          />
        </MField>

        <MField label={t('email')} required error={errors.email}>
          <input
            type="email"
            value={data.email}
            onChange={e => update('email', e.target.value)}
            placeholder="you@example.com"
            className="mfield-input"
            autoComplete="email"
          />
        </MField>

        <MField label={t('phone')} error={errors.phone}>
          <input
            type="tel"
            value={data.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="+66 XX XXX XXXX"
            className="mfield-input"
            autoComplete="tel"
          />
        </MField>

        <MField label={t('preferredContact')}>
          <div className="flex gap-2">
            {(['email', 'phone', 'whatsapp'] as const).map(opt => {
              const active = data.preferredContact === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update('preferredContact', opt)}
                  className={`flex-1 border px-2 py-2.5 text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                    active
                      ? 'border-teak-deep bg-teak-deep text-cream'
                      : 'border-line text-teak hover:border-gold-deep hover:text-gold-deep'
                  }`}
                >
                  {t(`contactOptions.${opt}`)}
                </button>
              );
            })}
          </div>
        </MField>
      </div>

      <div className="mt-4">
        <MField label={t('message')}>
          <textarea
            value={data.message}
            onChange={e => update('message', e.target.value)}
            placeholder={defaultMsg}
            rows={3}
            className="mfield-input resize-none"
          />
        </MField>
      </div>

      {/* Submit */}
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex items-center justify-center gap-2.5 bg-teak-deep px-8 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-cream transition-all duration-400 hover:bg-gold-deep disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('submit')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.5} />
        </button>
        <p className="max-w-[260px] text-[10px] leading-relaxed text-muted/70">{t('privacy')}</p>
      </div>

      <style jsx>{`
        :global(.mfield-input) {
          width: 100%;
          background: white;
          border: 1px solid var(--line);
          padding: 11px 13px;
          font-family: inherit;
          font-size: 14px;
          color: var(--teak);
          outline: none;
          transition: border-color 0.2s;
          border-radius: 0;
        }
        :global(.mfield-input:focus)       { border-color: var(--gold-deep); }
        :global(.mfield-input::placeholder){ color: var(--muted); opacity: 0.55; }
      `}</style>
    </form>
  );
}

function MField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}{required && <span className="ml-1 text-gold-deep">*</span>}
      </label>
      {children}
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-700">
          <AlertCircle className="h-3 w-3" strokeWidth={1.75} />{error}
        </div>
      )}
    </div>
  );
}
