import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { insertLead } from '@/lib/db/leads'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // validate required fields
  if (!body.name || !body.email) {
    return NextResponse.json({ error: 'name and email required' }, { status: 400 })
  }

  // 1. Save to Supabase first — source of truth, must not be lost
  const result = await insertLead({
    name: body.name,
    email: body.email,
    phone: body.phone || undefined,
    preferred_contact: body.preferredContact || 'email',
    message: body.message || undefined,
    crypto_payment: !!body.cryptoPayment,
    property_id: body.propertyId || null,
    property_title: body.propertyTitle || null,
    property_slug: body.propertySlug || null,
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
