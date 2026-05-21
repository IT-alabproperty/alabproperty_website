import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { insertLead } from '@/lib/db/leads'

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

  // 3. Telegram notification — non-fatal too. Sends a direct message to manager.
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (botToken && chatId && !botToken.includes('xxxx')) {
      const tgLines = [
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
      ].filter(Boolean).join('\n')

      // 10-секундный таймаут — не блокируем ответ форме надолго
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: tgLines,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        console.error('[api/leads] telegram send failed:', res.status, detail)
      }
    } else {
      console.warn('[api/leads] TELEGRAM_BOT_TOKEN/CHAT_ID not configured — TG skipped')
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/leads] telegram failed (lead saved to DB):', msg)
  }

  return NextResponse.json({ ok: true })
}

// Markdown V1 — экранируем символы которые ломают форматирование Telegram.
function escapeMd(s: string): string {
  return String(s).replace(/([_*`\[\]])/g, '\\$1')
}
