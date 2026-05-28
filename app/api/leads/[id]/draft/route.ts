import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createGmailDraft } from '@/lib/email/gmail'
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

  const gmailFrom = process.env.GMAIL_FROM
  const gmailConfigured = !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    gmailFrom
  )
  if (!gmailConfigured) {
    return NextResponse.json(
      { error: 'gmail OAuth not configured on server' },
      { status: 503 },
    )
  }

  const tpl = renderAgentReply({
    name: lead.name || (lead.email as string) || 'there',
    propertyTitle: lead.property_title || undefined,
    propertyLink: lead.property_slug
      ? `https://alabproperty.com/properties/${lead.property_slug}`
      : undefined,
    locale: 'ru',
  })

  try {
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
    console.error('[api/leads/draft] gmail draft failed:', e)
    return NextResponse.json(
      { error: 'failed to create draft', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
