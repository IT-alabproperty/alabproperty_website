import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderAgentReply } from '@/lib/email/agent-reply'
import { verifyLeadToken } from '@/lib/lead-tokens'

/** Friendly HTML page instead of raw JSON — clicked from Telegram, opened
 *  in the browser, so a human should see something readable. */
function errorPage(title: string, body: string, status = 500) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
     <style>body{font-family:system-ui,sans-serif;background:#2B1810;color:#F5EFE6;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;margin:0;text-align:center}
     h1{font-size:22px;font-weight:500;margin:0 0 12px;color:#C9A961}
     p{font-size:14px;line-height:1.6;color:rgba(245,239,230,0.75);max-width:480px}
     code{display:inline-block;margin-top:12px;padding:6px 10px;background:rgba(245,239,230,0.08);border-radius:6px;font-size:12px;color:#C9A961}</style>
     </head><body><h1>${title}</h1><p>${body}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = req.nextUrl.searchParams.get('t') || ''

  if (!id || id === 'null' || id === 'undefined') {
    console.error('[api/leads/draft] empty/null id in URL')
    return errorPage(
      'Invalid link',
      'This reply link is missing the lead id. The TG notification that produced it was sent before the fix was deployed — try a fresh lead.',
      400,
    )
  }

  if (!verifyLeadToken(id, token)) {
    console.error('[api/leads/draft] invalid token for id', id)
    return errorPage(
      'Link signature invalid',
      'This reply link can\'t be verified. It may have been tampered with, or the server secret rotated after the TG notification was sent.',
      403,
    )
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('id, name, email, property_title, property_slug, locale')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[api/leads/draft] supabase select failed:', error.message, 'id=', id)
    return errorPage('Database error', error.message, 500)
  }
  if (!lead) {
    console.error('[api/leads/draft] lead not in DB, id=', id)
    return errorPage(
      'Lead not found',
      `No lead with this id exists anymore. It may have been deleted from Supabase. The link was for lead <code>${id.slice(0, 8)}…</code>.`,
      404,
    )
  }

  // Reply in the same language the customer wrote in. We saved their UI
  // locale at submit time; default to RU only when the column is null
  // (older rows from before the locale field was added).
  const replyLocale: 'ru' | 'en' = lead.locale === 'en' ? 'en' : 'ru'

  const tpl = renderAgentReply({
    name: lead.name || (lead.email as string) || 'there',
    propertyTitle: lead.property_title || undefined,
    propertyLink: lead.property_slug
      ? `https://alabproperty.com/properties/${lead.property_slug}`
      : undefined,
    locale: replyLocale,
  })

  // Path 1 (preferred): Apps Script webhook — no OAuth/Cloud Console needed.
  // The user's existing Apps Script (same one that handles sheets-row) is
  // extended to handle action='gmail-draft'. Returns a Gmail web URL.
  //
  // Tracking diagnostic info here so the final error response can surface
  // WHY the draft creation failed (env missing? Apps Script returned bad
  // shape? Network error?) — Vercel's stdout logging panel is hard to find
  // and stripping the info in production gives us nothing to debug from.
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim()
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || ''
  // Diagnostic breadcrumbs — included in the final 503 body if both paths fail.
  const diag: Record<string, unknown> = {
    webhookUrlSet: !!webhookUrl,
    webhookSecretSet: !!webhookSecret,
    leadEmailPresent: !!lead.email,
  }
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
        diag.appsScriptStatus = res.status
        diag.appsScriptResponse = json
        if (res.ok && json.ok && typeof json.url === 'string' && json.url.startsWith('https://mail.google.com/')) {
          return NextResponse.redirect(json.url, { status: 302 })
        }
        console.error('[api/leads/draft] apps script returned:', res.status, json)
      } finally {
        clearTimeout(timeout)
      }
    } catch (e) {
      diag.appsScriptError = e instanceof Error ? e.message : String(e)
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
  diag.gmailOauthConfigured = gmailConfigured
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
      diag.gmailOauthError = e instanceof Error ? e.message : String(e)
      console.error('[api/leads/draft] gmail oauth draft failed:', e)
    }
  }

  return NextResponse.json(
    {
      error: 'no draft backend configured (Apps Script webhook or Gmail OAuth required)',
      diagnostics: diag,
    },
    { status: 503 },
  )
}
