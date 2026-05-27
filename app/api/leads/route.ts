import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { insertLead } from '@/lib/db/leads'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { makeLimiter, rateLimit, clientIp } from '@/lib/rate-limit'
import { scrubTokens } from '@/lib/log-safe'
import { notifyTechAdmins } from '@/lib/notify-tech'
import { renderLeadConfirmation } from '@/lib/email/lead-confirmation'

// 5 leads per IP every 10 minutes. Anything beyond that is almost certainly a
// bot — a real client doesn't submit the contact form six times.
const limiter = makeLimiter('lead', 5, '10 m')

// Hard caps prevent abuse: someone POST-ing a 10 MB "message" would otherwise
// blow up Resend / Telegram and burn through quotas. Numbers chosen well above
// any legitimate use of the form.
const NAME_MAX = 200
const EMAIL_MAX = 200
const PHONE_MAX = 50
const MESSAGE_MAX = 5000
const TITLE_MAX = 300
const ID_MAX = 100
const SLUG_MAX = 120
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/
// Match what `lib/db/leads.ts` accepts. Adding a new channel = add it here AND
// widen the Lead.preferred_contact union.
const ALLOWED_CONTACT = new Set(['email', 'phone', 'whatsapp'] as const)

interface CleanLead {
  name: string
  email: string
  phone: string | undefined
  preferredContact: 'email' | 'phone' | 'whatsapp'
  message: string | undefined
  cryptoPayment: boolean
  propertyId: string | null
  propertyTitle: string | null
  propertySlug: string | null
  /** UI locale at time of submission — drives confirmation email language. */
  locale: 'ru' | 'en'
}

function validate(raw: unknown): { ok: true; data: CleanLead } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'body must be object' }
  const b = raw as Record<string, unknown>

  const name = typeof b.name === 'string' ? b.name.trim() : ''
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  if (!name) return { ok: false, error: 'name required' }
  if (name.length > NAME_MAX) return { ok: false, error: `name too long (max ${NAME_MAX})` }
  if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX) {
    return { ok: false, error: 'invalid email' }
  }

  const phone = typeof b.phone === 'string' ? b.phone.trim().slice(0, PHONE_MAX) : ''
  const message = typeof b.message === 'string' ? b.message.trim() : ''
  if (message.length > MESSAGE_MAX) {
    return { ok: false, error: `message too long (max ${MESSAGE_MAX})` }
  }

  const contactRaw = typeof b.preferredContact === 'string' ? b.preferredContact : 'email'
  const preferredContact: 'email' | 'phone' | 'whatsapp' =
    contactRaw === 'phone' || contactRaw === 'whatsapp' ? contactRaw : 'email'

  const propertyId = typeof b.propertyId === 'string' ? b.propertyId.slice(0, ID_MAX) : null
  const propertyTitle = typeof b.propertyTitle === 'string' ? b.propertyTitle.slice(0, TITLE_MAX) : null
  const propertySlugRaw = typeof b.propertySlug === 'string' ? b.propertySlug.toLowerCase() : ''
  const propertySlug = propertySlugRaw && SLUG_RE.test(propertySlugRaw) && propertySlugRaw.length <= SLUG_MAX
    ? propertySlugRaw
    : null

  const locale: 'ru' | 'en' = b.locale === 'en' ? 'en' : 'ru'

  return {
    ok: true,
    data: {
      name,
      email,
      phone: phone || undefined,
      preferredContact,
      message: message || undefined,
      cryptoPayment: !!b.cryptoPayment,
      propertyId,
      propertyTitle,
      propertySlug,
      locale,
    },
  }
}

export async function POST(req: NextRequest) {
  // ───── Top-level safety net ─────
  // Any uncaught throw inside this handler (e.g. Upstash hiccup, Supabase
  // outage, runtime type mismatch from a future refactor) would otherwise
  // surface to the user as an opaque "500 something went wrong" with no log
  // trail. Wrap everything and turn unknown crashes into a structured response
  // + Telegram alert to tech admins.
  try {
    return await handleLeadSubmission(req)
  } catch (err) {
    const detail = err instanceof Error ? err.stack ?? err.message : String(err)
    console.error('[api/leads] uncaught:', scrubTokens(detail))
    notifyTechAdmins('critical', {
      source: '/api/leads',
      message: 'Unhandled exception in lead submission',
      detail,
      path: '/api/leads',
    }).catch(() => { /* don't let alert failure mask the original */ })
    return NextResponse.json(
      { error: 'internal-error' },
      { status: 500 },
    )
  }
}

async function handleLeadSubmission(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req)

  // Rate-limit failures (Upstash KV outage) shouldn't 500 the form — the form
  // is more important than the limiter. Treat any limiter error as "let it
  // through" and continue.
  let rl
  try {
    rl = await rateLimit(limiter, ip)
  } catch (e) {
    console.warn('[api/leads] rate limiter unavailable, allowing:', scrubTokens(e))
    rl = { ok: true, retryAfter: 0, remaining: Infinity }
  }
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'too many requests, try again later' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const validated = validate(raw)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const body = validated.data

  // 1. Save to Supabase first — source of truth, must not be lost
  const result = await insertLead({
    name: body.name,
    email: body.email,
    phone: body.phone || undefined,
    preferred_contact: body.preferredContact,
    message: body.message || undefined,
    crypto_payment: body.cryptoPayment,
    property_id: body.propertyId,
    property_title: body.propertyTitle,
    property_slug: body.propertySlug,
  })

  if (!result.success) {
    // DB write failure — page the team, lead is lost otherwise.
    notifyTechAdmins('critical', {
      source: '/api/leads · supabase insert',
      message: 'Lead INSERT failed — data lost',
      detail: result.error ?? '(no message)',
    }).catch(() => { /* never block the response */ })
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // 2. Send TWO emails in parallel — both non-fatal: the lead is already in
  //    Supabase, anything below is best-effort UX polish.
  //    (a) Plain-text inbox notification to the agency mailbox.
  //    (b) Branded HTML confirmation to the prospect's own inbox.
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim() ?? ''
    if (!apiKey || apiKey.includes('xxxx')) {
      console.warn('[api/leads] RESEND_API_KEY not configured — emails skipped, lead saved to Supabase only')
    } else {
      const resend = new Resend(apiKey)

      const adminLines = [
        `Name: ${body.name}`,
        `Email: ${body.email}`,
        body.phone ? `Phone: ${body.phone}` : null,
        `Preffered contact type: ${body.preferredContact || 'email'}`,
        body.propertyTitle ? `Property: ${body.propertyTitle}` : null,
        body.propertySlug ? `Link: https://alabproperty.com/properties/${body.propertySlug}` : null,
        body.cryptoPayment ? 'Pay in crypto: Yes' : null,
        '',
        'Message:',
        body.message || '(empty)',
        '',
        `Date: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Bangkok' })}`,
      ].filter(Boolean)

      const confirmation = renderLeadConfirmation({
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
        propertyTitle: body.propertyTitle,
        propertySlug: body.propertySlug,
        cryptoPayment: body.cryptoPayment,
        locale: body.locale,
      })

      await Promise.allSettled([
        resend.emails.send({
          from: 'ALAB Property <noreply@alabproperty.com>',
          to: ['property@alabproperty.com'],
          replyTo: body.email,
          subject: `🔔 New Lead${body.propertyTitle ? `: ${body.propertyTitle}` : ''} — ${body.name}`,
          text: adminLines.join('\n'),
        }),
        resend.emails.send({
          from: 'ALAB Property <noreply@alabproperty.com>',
          to: [body.email],
          replyTo: 'property@alabproperty.com',
          subject: confirmation.subject,
          html: confirmation.html,
          text: confirmation.text,
        }),
      ])
    }
  } catch (err) {
    console.error('[api/leads] email send failed (lead saved to DB):', scrubTokens(err))
    // Page tech admins — Resend down means new leads don't get a reply.
    notifyTechAdmins('error', {
      source: '/api/leads · resend',
      message: 'Failed to send lead emails (admin + customer)',
      detail: err instanceof Error ? err.stack ?? err.message : String(err),
    }).catch(() => { /* never block the response */ })
  }

  // 3. Telegram notification — non-fatal too. Sends to all users subscribed to 'leads' topic.
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? ''
    if (botToken && !botToken.includes('xxxx')) {
      // Find all active users whose role subscribes to 'leads' notifications
      let recipients: Array<{ chat_id: number; lang: 'ru' | 'en' }> = []
      try {
        const { data, error } = await supabaseAdmin
          .from('bot_users')
          .select('telegram_id, notification_lang, role:roles!inner(notify_topics)')
          .eq('active', true)
        if (error) throw error
        if (data) {
          recipients = data
            .filter((u) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const topics = (u as any).role?.notify_topics as string[] | undefined
              return Array.isArray(topics) && topics.includes('leads')
            })
            .map((u) => ({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              chat_id: Number((u as any).telegram_id),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              lang: ((u as any).notification_lang as 'ru' | 'en') ?? 'ru',
            }))
        }
      } catch (e) {
        console.error('[api/leads] failed to load lead subscribers:', e)
      }

      // Fallback: env TELEGRAM_CHAT_IDS or TELEGRAM_CHAT_ID.
      // Supabase subscribers are primary; env IDs are only used when DB has none.
      if (recipients.length === 0) {
        const fallback = process.env.TELEGRAM_CHAT_IDS?.trim() ?? process.env.TELEGRAM_CHAT_ID?.trim() ?? ''
        if (fallback) {
          recipients = fallback
            .split(/[\s,;]+/)
            .map((id) => Number(id.trim()))
            .filter((id) => Number.isFinite(id))
            .map((chat_id) => ({ chat_id, lang: 'ru' }))

          if (recipients.length === 0) {
            console.warn('[api/leads] TELEGRAM_CHAT_IDS / TELEGRAM_CHAT_ID provided but contained no valid numeric chat IDs — TG skipped')
          }
        } else {
          console.warn('[api/leads] no lead subscribers and no TELEGRAM_CHAT_ID(S) — TG skipped')
        }
      }

      for (const r of recipients) {
        const tgLines = buildLeadMessage(body, r.lang)
        // Inline keyboard with one-tap reply via Gmail compose. Reply language
        // matches the customer's locale, not the recipient's notification_lang.
        const replyTemplate = buildReplyTemplate(body)
        const mailtoUrl = `mailto:${encodeURIComponent(body.email)}?subject=${encodeURIComponent(replyTemplate.subject)}&body=${encodeURIComponent(replyTemplate.body)}`
        const replyButtonLabel = r.lang === 'en' ? '✉️ Reply in Gmail' : '✉️ Ответить в Gmail'
        const inline_keyboard = [[{ text: replyButtonLabel, url: mailtoUrl }]]
        if (body.propertySlug) {
          const openLabel = r.lang === 'en' ? '🏠 Open property' : '🏠 Открыть объект'
          inline_keyboard.push([
            { text: openLabel, url: `https://alabproperty.com/properties/${body.propertySlug}` },
          ])
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10_000)
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: r.chat_id,
              text: tgLines,
              parse_mode: 'Markdown',
              disable_web_page_preview: true,
              reply_markup: { inline_keyboard },
            }),
            signal: controller.signal,
          })
          if (!res.ok) {
            const detail = await res.text().catch(() => '')
            console.error('[api/leads] telegram send failed:', r.chat_id, res.status, scrubTokens(detail))
          }
        } catch (e) {
          console.error('[api/leads] telegram fetch failed:', r.chat_id, scrubTokens(e))
        } finally {
          clearTimeout(timeout)
        }
      }
    } else {
      console.warn('[api/leads] TELEGRAM_BOT_TOKEN not configured — TG skipped')
    }
  } catch (err) {
    console.error('[api/leads] telegram failed (lead saved to DB):', scrubTokens(err))
    notifyTechAdmins('error', {
      source: '/api/leads · telegram',
      message: 'Failed to send lead notification to Telegram',
      detail: err instanceof Error ? err.stack ?? err.message : String(err),
    }).catch(() => { /* never block */ })
  }

  return NextResponse.json({ ok: true })
}

/**
 * Pre-filled reply body for the "Reply in Gmail" inline-keyboard button.
 * Opens the recipient's default mail client at compose with To/Subject/Body
 * already populated — admin just tweaks and sends.
 *
 * Language follows the customer's `locale` (the lead's UI language at time
 * of submission), so they hear back in the language they wrote in.
 */
function buildReplyTemplate(body: CleanLead): { subject: string; body: string } {
  if (body.locale === 'en') {
    const subject = body.propertyTitle
      ? `Re: Your inquiry about ${body.propertyTitle}`
      : 'Re: Your inquiry with ALAB Property'
    const lines = [
      `Hello ${body.name},`,
      '',
      `Thank you for reaching out to ALAB Property.`,
      body.propertyTitle
        ? `We've received your inquiry about "${body.propertyTitle}" and would like to discuss further.`
        : `We've received your inquiry and would like to discuss your interest in more detail.`,
      '',
      `Could you let me know a convenient time for a call, or feel free to reply here with any questions?`,
      '',
      `Warm regards,`,
      `ALAB Property Team`,
      `property@alabproperty.com`,
    ]
    return { subject, body: lines.join('\n') }
  }
  const subject = body.propertyTitle
    ? `Re: Ваш запрос по объекту ${body.propertyTitle}`
    : 'Re: Ваш запрос в ALAB Property'
  const lines = [
    `Здравствуйте, ${body.name}!`,
    '',
    `Благодарим за обращение в ALAB Property.`,
    body.propertyTitle
      ? `Мы получили ваш запрос по объекту «${body.propertyTitle}» и готовы предметно обсудить детали.`
      : `Мы получили ваш запрос и хотели бы подробнее обсудить ваши задачи.`,
    '',
    `Подскажите, в какое время вам удобно созвониться, или можете ответить здесь — на любые вопросы я отвечу подробно.`,
    '',
    `С уважением,`,
    `Команда ALAB Property`,
    `property@alabproperty.com`,
  ]
  return { subject, body: lines.join('\n') }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLeadMessage(body: any, lang: 'ru' | 'en'): string {
  if (lang === 'en') {
    return [
      `🔔 *New lead*`,
      ``,
      `*Name:* ${escapeMd(body.name)}`,
      `*Email:* ${escapeMd(body.email)}`,
      body.phone ? `*Phone:* ${escapeMd(body.phone)}` : null,
      `*Preferred contact:* ${escapeMd(body.preferredContact || 'email')}`,
      body.propertyTitle ? `*Property:* ${escapeMd(body.propertyTitle)}` : null,
      body.propertySlug
        ? `[Open property](https://alabproperty.com/properties/${body.propertySlug})`
        : null,
      body.cryptoPayment ? `💰 *Pay in crypto:* Yes` : null,
      ``,
      `*Message:*`,
      escapeMd(body.message || '(empty)'),
    ]
      .filter(Boolean)
      .join('\n')
  }
  return [
    `🔔 *Новый лид*`,
    ``,
    `*Имя:* ${escapeMd(body.name)}`,
    `*Email:* ${escapeMd(body.email)}`,
    body.phone ? `*Телефон:* ${escapeMd(body.phone)}` : null,
    `*Способ связи:* ${escapeMd(body.preferredContact || 'email')}`,
    body.propertyTitle ? `*Объект:* ${escapeMd(body.propertyTitle)}` : null,
    body.propertySlug
      ? `[Открыть объект](https://alabproperty.com/properties/${body.propertySlug})`
      : null,
    body.cryptoPayment ? `💰 *Оплата криптой:* Да` : null,
    ``,
    `*Сообщение:*`,
    escapeMd(body.message || '(пусто)'),
  ]
    .filter(Boolean)
    .join('\n')
}

// Markdown V1 — экранируем символы которые ломают форматирование Telegram.
function escapeMd(s: string): string {
  return String(s).replace(/([_*`\[\]])/g, '\\$1')
}
