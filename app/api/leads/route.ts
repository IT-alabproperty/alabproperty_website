import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { insertLead } from '@/lib/db/leads'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { makeLimiter, rateLimit, clientIp } from '@/lib/rate-limit'

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
    },
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rl = await rateLimit(limiter, ip)
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
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // 2. Send notification email — non-fatal: if it fails, lead is still in Supabase
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey.includes('xxxx')) {
      console.warn('[api/leads] RESEND_API_KEY not configured — email skipped, lead saved to Supabase only')
    } else {
      const resend = new Resend(apiKey)

      const lines = [
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

      await resend.emails.send({
        from: 'ALAB Property <noreply@alabproperty.com>',
        to: ['property@alabproperty.com'],
        replyTo: body.email,
        subject: `🔔 New Lead${body.propertyTitle ? `: ${body.propertyTitle}` : ''} — ${body.name}`,
        text: lines.join('\n'),
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/leads] email send failed (lead saved to DB):', msg)
  }

  // 3. Telegram notification — non-fatal too. Sends to all users subscribed to 'leads' topic.
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
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

      // Fallback: env TELEGRAM_CHAT_ID (single recipient) if DB has no subscribers
      if (recipients.length === 0) {
        const fallback = process.env.TELEGRAM_CHAT_ID
        if (fallback) {
          recipients = [{ chat_id: Number(fallback), lang: 'ru' }]
        } else {
          console.warn('[api/leads] no lead subscribers and no TELEGRAM_CHAT_ID — TG skipped')
        }
      }

      for (const r of recipients) {
        const tgLines = buildLeadMessage(body, r.lang)
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
            }),
            signal: controller.signal,
          })
          if (!res.ok) {
            const detail = await res.text().catch(() => '')
            console.error('[api/leads] telegram send failed:', r.chat_id, res.status, detail)
          }
        } catch (e) {
          console.error('[api/leads] telegram fetch failed:', r.chat_id, e)
        } finally {
          clearTimeout(timeout)
        }
      }
    } else {
      console.warn('[api/leads] TELEGRAM_BOT_TOKEN not configured — TG skipped')
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/leads] telegram failed (lead saved to DB):', msg)
  }

  return NextResponse.json({ ok: true })
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
