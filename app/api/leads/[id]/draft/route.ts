import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderAgentReply } from '@/lib/email/agent-reply'
import { verifyLeadToken } from '@/lib/lead-tokens'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = req.nextUrl.searchParams.get('t') || ''

  if (!verifyLeadToken(id, token)) {
    return NextResponse.json({ error: 'invalid token' }, { status: 403 })
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('id, name, email, property_title, property_slug')
    .eq('id', id)
    .single()

  if (error || !lead) {
    return NextResponse.json({ error: 'lead not found' }, { status: 404 })
  }

  const tpl = renderAgentReply({
    name: lead.name || (lead.email as string) || 'there',
    propertyTitle: lead.property_title || undefined,
    propertyLink: lead.property_slug
      ? `https://alabproperty.com/properties/${lead.property_slug}`
      : undefined,
    locale: 'ru',
  })

  // Path 1 (preferred): Apps Script webhook — no OAuth/Cloud Console needed.
  // The user's existing Apps Script (same one that handles sheets-row) is
  // extended to handle action='gmail-draft'. Returns a Gmail web URL.
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim()
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || ''
  if (webhookUrl) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25_000)
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: webhookSecret,
            action: 'gmail-draft',
            to: lead.email,
            subject: tpl.subject,
            text: tpl.text,
            html: tpl.html,
          }),
          signal: controller.signal,
          redirect: 'follow',
        })
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string }
        if (res.ok && json.ok && typeof json.url === 'string' && json.url.startsWith('https://mail.google.com/')) {
          return NextResponse.redirect(json.url, { status: 302 })
        }
        console.error('[api/leads/draft] apps script returned:', res.status, json)
      } finally {
        clearTimeout(timeout)
      }
    } catch (e) {
      console.error('[api/leads/draft] apps script call failed:', e instanceof Error ? e.message : e)
    }
    // Fall through to OAuth path if Apps Script failed
  }

  // Path 2 (legacy): Gmail OAuth via googleapis. Requires Cloud Console setup.
  const gmailFrom = process.env.GMAIL_FROM
  const gmailConfigured = !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    gmailFrom
  )
  if (gmailConfigured) {
    try {
      const { createGmailDraft } = await import('@/lib/email/gmail')
      const draft = await createGmailDraft({
        from: gmailFrom!,
        to: lead.email!,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      })

      const redirectTo = draft.threadId
        ? `https://mail.google.com/mail/u/0/#drafts/${draft.threadId}`
        : `https://mail.google.com/mail/u/0/#drafts`
      return NextResponse.redirect(redirectTo, { status: 302 })
    } catch (e) {
      console.error('[api/leads/draft] gmail oauth draft failed:', e)
    }
  }

  return NextResponse.json(
    { error: 'no draft backend configured (Apps Script webhook or Gmail OAuth required)' },
    { status: 503 },
  )
}
