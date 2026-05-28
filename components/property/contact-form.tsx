'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { Locale, Property } from '@/lib/types';

type ContactChannel = 'email' | 'phone' | 'whatsapp';

interface FormData {
  name: string;
  email: string;
  phone: string;
  channel: ContactChannel;
  message: string;
  cryptoPayment: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function ContactForm({ property }: { property: Property }) {
  const t = useTranslations('Contact');
  const locale = useLocale() as Locale;

  const defaultMessage = t('defaultMessage', { name: property.name[locale] });

  const [data, setData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    channel: 'email',
    message: defaultMessage,
    cryptoPayment: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!data.name.trim()) next.name = t('errors.nameRequired');
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = t('errors.emailInvalid');
    }
    if (data.channel === 'phone' || data.channel === 'whatsapp') {
      if (!data.phone.trim() || !/^[+\d\s\-()]{7,}$/.test(data.phone)) {
        next.phone = t('errors.phoneInvalid');
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      propertyId: property.id,
      propertySlug: property.slug,
      propertyTitle: property.name[locale],
      ...data,
      preferredContact: data.channel,
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
      setSuccess(true);
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

  if (success) {
    return (
      <div className="rounded-lg bg-teak-deep p-10 text-center text-cream sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
          <Check className="h-8 w-8 text-gold" strokeWidth={1.75} />
        </div>
        <h3 className="font-serif text-3xl font-normal">{t('successTitle')}</h3>
        <p className="mx-auto mt-4 max-w-[420px] text-base leading-[1.6] text-cream/75">
          {t('successDesc')}
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setData({ name: '', email: '', phone: '', channel: 'email', message: defaultMessage, cryptoPayment: false });
          }}
          className="mt-8 rounded-full border border-cream/30 px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-cream/10"
        >
          {t('sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-cream-warm/40 p-6 sm:p-10">
      <Eyebrow className="mb-6">{t('title')}</Eyebrow>
      <p className="mb-8 max-w-[420px] text-base leading-[1.6] text-teak-warm">{t('subtitle')}</p>

      <div className="space-y-5">
        <Field label={t('name')} error={errors.name}>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder={t('namePlaceholder')}
            className="alab-form-input"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t('email')} error={errors.email}>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="name@example.com"
              className="alab-form-input"
            />
          </Field>
          <Field label={t('phone')} error={errors.phone}>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              placeholder="+66 …"
              className="alab-form-input"
            />
          </Field>
        </div>

        <Field label={t('preferredContact')}>
          <div className="flex flex-wrap gap-2">
            {(['email', 'phone', 'whatsapp'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setData({ ...data, channel: c })}
                className={`rounded-full border px-4 py-2 text-xs font-medium tracking-tight transition-colors ${
                  data.channel === c
                    ? 'border-teak-deep bg-teak-deep text-cream'
                    : 'border-[var(--line-strong)] bg-paper text-teak hover:border-teak-deep'
                }`}
              >
                {t(`contactOptions.${c}`)}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t('message')}>
          <textarea
            value={data.message}
            onChange={(e) => setData({ ...data, message: e.target.value })}
            rows={4}
            className="alab-form-input alab-form-textarea"
          />
        </Field>

        {/* Crypto payment checkbox */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setData({ ...data, cryptoPayment: !data.cryptoPayment })}
            className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
              data.cryptoPayment
                ? 'border-teak-deep bg-teak-deep text-cream'
                : 'border-[var(--line-strong)] bg-paper text-transparent hover:border-teak-warm'
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
            onClick={() => setData({ ...data, cryptoPayment: !data.cryptoPayment })}
          >
            {locale === 'ru' ? 'Интересует оплата в криптовалюте' : 'Interested in crypto payment'}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-teak-deep px-8 py-4 text-xs font-medium uppercase tracking-[0.16em] text-cream transition-all hover:bg-gold-deep disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </button>

      {submitError && (
        <p className="mt-4 text-xs text-red-700">{submitError}</p>
      )}

      <p className="mt-4 text-[11px] leading-[1.5] text-muted">{t('privacy')}</p>

      <style>{`
        .alab-form-input {
          width: 100%;
          padding: 12px 16px;
          background: white;
          border: 1px solid var(--line-strong);
          border-radius: 6px;
          font-family: inherit;
          font-size: 15px;
          color: var(--teak-deep);
          outline: none;
          transition: border-color 0.2s;
        }
        .alab-form-input:focus { border-color: var(--gold-deep); }
        .alab-form-textarea {
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
          line-height: 1.5;
        }
      `}</style>
    </form>
  );
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}
