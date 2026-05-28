'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Check, AlertCircle } from 'lucide-react';
import type { Property, Locale } from '@/lib/types';
import { useLocale } from 'next-intl';

interface ContactFormProps {
  property: Property;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredContact: 'email' | 'phone' | 'whatsapp';
  cryptoPayment: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const initial: FormData = {
  name: '',
  email: '',
  phone: '',
  message: '',
  preferredContact: 'email',
  cryptoPayment: false,
};

export function ContactForm({ property }: ContactFormProps) {
  const t = useTranslations('Contact');
  const locale = useLocale() as Locale;
  const [data, setData] = useState<FormData>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill message with property reference
  const defaultMessage = t('defaultMessage', { name: property.name[locale] });

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!data.name.trim() || data.name.trim().length < 2) errs.name = t('errors.nameRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = t('errors.emailInvalid');
    if (data.phone && !/^[+\d\s()-]{6,}$/.test(data.phone)) errs.phone = t('errors.phoneInvalid');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      ...data,
      message: data.message.trim() || defaultMessage,
      cryptoPayment: data.cryptoPayment,
      propertyId: property.id,
      propertySlug: property.slug,
      propertyTitle: property.name[locale],
      // Send user's UI locale so the server can pick the right language for
      // their confirmation email + Markdown reply template.
      locale,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch {
      setSubmitError(
        locale === 'ru'
          ? 'Не удалось отправить заявку. Попробуйте ещё раз.'
          : 'Failed to submit. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-lg border border-[var(--line)] bg-paper px-6 py-12 text-center sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-deep/10 text-gold-deep">
          <Check className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-3xl font-normal text-teak-deep">{t('successTitle')}</h3>
        <p className="max-w-sm text-sm leading-[1.6] text-teak-warm">{t('successDesc')}</p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setData(initial);
          }}
          className="mt-2 text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 transition-colors hover:text-gold-deep hover:underline"
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-[var(--line)] bg-paper p-6 sm:p-9"
      noValidate
    >
      <div className="mb-7">
        <h3 className="font-serif text-2xl font-normal text-teak-deep">{t('title')}</h3>
        <p className="mt-1.5 text-sm text-muted">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label={t('name')}
          required
          error={errors.name}
        >
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('namePlaceholder')}
            className="alab-input"
            autoComplete="name"
          />
        </Field>

        <Field
          label={t('email')}
          required
          error={errors.email}
        >
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            className="alab-input"
            autoComplete="email"
          />
        </Field>

        <Field label={t('phone')} error={errors.phone}>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+66 XX XXX XXXX"
            className="alab-input"
            autoComplete="tel"
          />
        </Field>

        <Field label={t('preferredContact')}>
          <div className="flex gap-2">
            {(['email', 'phone', 'whatsapp'] as const).map((opt) => {
              const active = data.preferredContact === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update('preferredContact', opt)}
                  className={`flex-1 rounded-md border px-3 py-2.5 text-xs uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? 'border-teak-deep bg-teak-deep text-cream'
                      : 'border-[var(--line-strong)] text-teak hover:border-gold-deep hover:text-gold-deep'
                  }`}
                >
                  {t(`contactOptions.${opt}`)}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <Field label={t('message')}>
          <textarea
            value={data.message}
            onChange={(e) => update('message', e.target.value)}
            placeholder={defaultMessage}
            rows={4}
            className="alab-input resize-none"
          />
        </Field>
      </div>

      {/* Crypto payment checkbox */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => update('cryptoPayment', !data.cryptoPayment)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
            data.cryptoPayment
              ? 'border-teak-deep bg-teak-deep text-cream'
              : 'border-[var(--line-strong)] text-transparent hover:border-teak-warm'
          }`}
          aria-checked={data.cryptoPayment}
          role="checkbox"
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span
          className="cursor-pointer select-none text-[13px] text-teak-warm"
          onClick={() => update('cryptoPayment', !data.cryptoPayment)}
        >
          {locale === 'ru' ? 'Интересует оплата в криптовалюте' : 'Interested in crypto payment'}
        </span>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-teak-deep px-7 py-4 text-xs font-medium uppercase tracking-[0.16em] text-cream transition-all duration-400 hover:bg-gold-deep disabled:opacity-60 sm:w-auto"
      >
        {submitting ? t('submitting') : t('submit')}
        <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      {submitError && (
        <div className="mt-4 flex items-center gap-1.5 text-[12px] text-red-700">
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
          {submitError}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        {t('privacy')}
      </p>

      <style jsx>{`
        :global(.alab-input) {
          width: 100%;
          background: white;
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 14px;
          color: var(--teak);
          outline: none;
          transition: border-color 0.2s;
        }
        :global(.alab-input:focus) {
          border-color: var(--gold-deep);
        }
        :global(.alab-input::placeholder) {
          color: var(--muted);
          opacity: 0.6;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
        {required && <span className="ml-1 text-gold-deep">*</span>}
      </label>
      {children}
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-700">
          <AlertCircle className="h-3 w-3" strokeWidth={1.75} />
          {error}
        </div>
      )}
    </div>
  );
}
