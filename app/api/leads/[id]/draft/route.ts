import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderAgentReply } from '@/lib/email/agent-reply'
import { verifyLeadToken } from '@/lib/lead-tokens'

/**
 * GET /api/leads/[id]/draft?t=<HMAC>
 *
 * Click target of the "Reply in Gmail" button on Telegram lead notifications.
 *
 * Flow:
 *   1. First click on a lead → create an HTML draft in agent's Gmail via the
 *      Apps Script webhook, save the returned threadId to `leads.gmail_draft_thread_id`.
 *   2. Subsequent clicks on the same lead → skip Apps Script entirely, just
 *      redirect to the cached draft URL. Avoids piling up duplicate drafts
 *      in the agent's Drafts folder.
 *   3. Render an HTML interstitial that auto-redirects to the Gmail drafts
 *      URL (so iOS Safari/Telegram in-app browser can follow it cleanly) and
 *      shows visible fallback buttons:
 *        - Open in Gmail (primary, HTML preserved)
 *        - Quick text reply (secondary, plain-text compose via deep link)
 *
 * Why interstitial vs direct 302: Telegram's in-app browser sometimes
 * mishandles redirect chains to mail.google.com. The interstitial gives us
 * a stable landing page where we control the redirect behavior, and the
 * visible buttons act as a manual fallback if auto-redirect blocks.
 */

const APP_NAME = 'ALAB Property'

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function errorPage(title: string, body: string, status = 500) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
     <style>body{font-family:system-ui,sans-serif;background:#2B1810;color:#F5EFE6;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;margin:0;text-align:center}
     h1{font-size:22px;font-weight:500;margin:0 0 12px;color:#C9A961}
     p{font-size:14px;line-height:1.6;color:rgba(245,239,230,0.75);max-width:480px}
     code{display:inline-block;margin-top:12px;padding:6px 10px;background:rgba(245,239,230,0.08);border-radius:6px;font-size:12px;color:#C9A961}</style>
     </head><body><h1>${escapeHtml(title)}</h1><p>${body}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

/**
 * Call the Apps Script webhook to create an HTML draft in the agent's
 * Gmail. Returns the threadId on success, null on any failure (caller
 * falls back to a plain-text compose link).
 *
 * The webhook is the same one used for Sheets append — separate `action`
 * field routes to the draft handler on the script side.
 */
async function createGmailDraftViaAppsScript(args: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<{ threadId: string } | { error: string }> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim()
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || ''
  if (!webhookUrl) return { error: 'webhook url not configured' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: webhookSecret,
        action: 'gmail-draft',
        to: args.to,
        subject: args.subject,
        text: args.text,
        html: args.html,
      }),
      signal: controller.signal,
      redirect: 'follow',
    })
    // Read response body as text first so we can log it even when it isn't
    // JSON (e.g. Apps Script returning an HTML 404 page because the
    // deployment was archived). Without this, parse errors silently drop
    // the diagnostic and we're left guessing at "apps script HTTP" with
    // no status, no body, no signal.
    const bodyText = await res.text().catch(() => '')
    let data: { ok?: boolean; threadId?: string; error?: string } = {}
    try { data = JSON.parse(bodyText) } catch { /* not JSON */ }

    if (!res.ok || !data.ok || !data.threadId) {
      // Surface the FULL diagnostic: status code, body shape, first chars
      // of raw response. Length-capped so we don't blow up logs with
      // entire HTML 404 pages.
      const snippet = bodyText.slice(0, 200).replace(/\s+/g, ' ')
      return {
        error: `HTTP ${res.status} ` +
          (data.error ? `script-error="${data.error}" ` : '') +
          `body="${snippet}"`,
      }
    }
    return { threadId: data.threadId }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'fetch failed' }
  } finally {
    clearTimeout(timer)
  }
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
      `This reply link can&apos;t be verified. It may have been tampered with, or the server secret rotated after the TG notification was sent.`,
      403,
    )
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('id, name, email, property_title, property_slug, locale, gmail_draft_thread_id')
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
  if (!lead.email) {
    return errorPage(
      'No email on lead',
      `The lead doesn&apos;t have an email saved — can&apos;t open a reply window. Check the row in Supabase or contact the visitor by phone.`,
      400,
    )
  }

  // Reply in the same language the visitor used. Old rows (created before
  // the `leads.locale` column existed) read as null → default to RU.
  const replyLocale: 'ru' | 'en' = lead.locale === 'en' ? 'en' : 'ru'
  const isRu = replyLocale === 'ru'

  const tpl = renderAgentReply({
    name: lead.name || (lead.email as string) || 'there',
    propertyTitle: lead.property_title || undefined,
    propertyLink: lead.property_slug
      ? `https://alabproperty.com/properties/${lead.property_slug}`
      : undefined,
    locale: replyLocale,
  })

  // Cached threadId from a previous click? Reuse it — no need to spam the
  // agent's Drafts folder with new copies on every click. If null, this is
  // the first click for this lead.
  let threadId: string | null = lead.gmail_draft_thread_id ?? null
  let draftError: string | null = null

  if (!threadId) {
    const result = await createGmailDraftViaAppsScript({
      to: lead.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    })
    if ('threadId' in result) {
      threadId = result.threadId
      // Persist so future clicks on this lead jump straight to the same
      // draft. We ignore errors here on purpose — if the UPDATE fails
      // (Supabase blip, column missing), we still serve the draft URL
      // for this request; the next click just creates another draft.
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({ gmail_draft_thread_id: threadId })
        .eq('id', id)
      if (updateError) {
        console.error('[api/leads/draft] failed to cache threadId:', updateError.message)
      }
    } else {
      draftError = result.error
      console.error('[api/leads/draft] apps script draft failed:', draftError)
    }
  }

  // Build URLs that the interstitial offers. We always have the plain-text
  // compose fallback ready (no Apps Script dependency). The HTML draft URL
  // is only set if Apps Script succeeded or we had a cached threadId.
  const htmlDraftUrl = threadId
    ? `https://mail.google.com/mail/u/0/#drafts/${encodeURIComponent(threadId)}`
    : null

  // Cap body length for the plain-text fallback. Gmail's compose URL accepts
  // ~2KB total — bigger and the browser silently truncates or rejects.
  const MAX_BODY = 1500
  const bodyText =
    tpl.text.length > MAX_BODY ? tpl.text.slice(0, MAX_BODY - 3) + '…' : tpl.text
  const toEnc = encodeURIComponent(lead.email)
  const subjectEnc = encodeURIComponent(tpl.subject)
  const bodyEnc = encodeURIComponent(bodyText)
  // Gmail iOS/Android app deep link for compose (plain text only).
  const appComposeUrl = `googlegmail://co?to=${toEnc}&subject=${subjectEnc}&body=${bodyEnc}`
  // Gmail Web compose URL — works in any browser, mobile or desktop.
  const webComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEnc}&su=${subjectEnc}&body=${bodyEnc}`

  // Localised UI strings for this single interstitial.
  const t = isRu
    ? {
        title: 'Открываю Gmail',
        replyTo: 'Ответ для',
        primary: 'Открыть HTML-черновик',
        secondary: 'Быстрый ответ (текст)',
        autoNote: 'Перенаправляю в Gmail…',
        fallbackNote:
          'Если приложение Gmail не открылось — используй веб-кнопку или быстрый текстовый ответ.',
        draftErrorNote:
          'Не удалось создать HTML-черновик. Используй быстрый ответ ниже — это рабочий вариант с обычным текстом.',
      }
    : {
        title: 'Opening Gmail',
        replyTo: 'Reply to',
        primary: 'Open HTML draft',
        secondary: 'Quick text reply',
        autoNote: 'Redirecting to Gmail…',
        fallbackNote: `If Gmail didn&apos;t open, use the web button or the quick text reply.`,
        draftErrorNote: `Couldn&apos;t create the HTML draft. Use the quick reply below — plain text still works.`,
      }

  const recipient = escapeHtml(lead.name || lead.email)

  // The auto-redirect target: HTML draft if available, otherwise the web
  // compose URL (plain text). This way the agent always lands somewhere
  // useful even if Apps Script is down.
  const autoRedirectUrl = htmlDraftUrl ?? webComposeUrl

  const html = `<!doctype html>
<html lang="${replyLocale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(t.title)} — ${APP_NAME}</title>
<style>
  *,*::before,*::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
    background: #2B1810; color: #F5EFE6;
    min-height: 100vh; margin: 0;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%; max-width: 440px;
    background: rgba(245,239,230,0.04);
    border: 1px solid rgba(245,239,230,0.12);
    border-radius: 16px;
    padding: 28px 24px;
    text-align: center;
  }
  h1 {
    font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #C9A961; font-weight: 600; margin: 0 0 8px;
  }
  .recipient {
    font-size: 20px; font-weight: 500; line-height: 1.3;
    margin: 4px 0 24px; color: #F5EFE6;
  }
  .recipient small {
    display: block; font-size: 11px; font-weight: 400;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: rgba(245,239,230,0.5); margin-bottom: 6px;
  }
  .btn {
    display: block; width: 100%;
    padding: 14px 20px; margin: 10px 0;
    border-radius: 10px; text-decoration: none;
    font-size: 14px; font-weight: 500;
    transition: opacity 0.2s, transform 0.2s;
  }
  .btn:active { transform: scale(0.98); }
  .btn-primary { background: #C9A961; color: #2B1810; }
  .btn-primary:hover { opacity: 0.92; }
  .btn-secondary {
    background: transparent;
    border: 1px solid rgba(245,239,230,0.25);
    color: #F5EFE6;
  }
  .btn-secondary:hover { background: rgba(245,239,230,0.06); }
  .btn-disabled {
    background: rgba(245,239,230,0.08);
    color: rgba(245,239,230,0.35);
    cursor: not-allowed;
    pointer-events: none;
  }
  .note {
    margin-top: 16px;
    font-size: 11px; line-height: 1.5;
    color: rgba(245,239,230,0.45);
  }
  .draft-error {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(255, 180, 80, 0.08);
    border: 1px solid rgba(255, 180, 80, 0.25);
    color: rgba(255, 200, 130, 0.85);
    font-size: 12px;
    line-height: 1.5;
    text-align: left;
  }
  .draft-error-detail {
    display: block;
    margin-top: 8px;
    padding: 6px 8px;
    background: rgba(0,0,0,0.25);
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    line-height: 1.4;
    color: rgba(255, 220, 180, 0.95);
    word-break: break-word;
  }
</style>
</head>
<body>
<div class="card">
  <h1>${escapeHtml(t.title)}</h1>
  <div class="recipient">
    <small>${escapeHtml(t.replyTo)}</small>
    ${recipient}
  </div>
  ${
    htmlDraftUrl
      ? `<a href="${htmlDraftUrl}" class="btn btn-primary">${escapeHtml(t.primary)}</a>`
      : `<div class="btn btn-disabled">${escapeHtml(t.primary)}</div>
         <div class="draft-error">
           ${t.draftErrorNote}
           ${draftError ? `<code class="draft-error-detail">${escapeHtml(draftError)}</code>` : ''}
         </div>`
  }
  <a href="${appComposeUrl}" class="btn btn-secondary">${escapeHtml(t.secondary)}</a>
  <p class="note">${htmlDraftUrl ? t.autoNote : t.fallbackNote}</p>
</div>
<script>
  // Auto-redirect: prefer HTML draft if Apps Script gave us one, fall back
  // to web compose URL otherwise. Short delay lets the page render so the
  // user sees the buttons before the OS hands off — useful when the
  // redirect target opens in a different app.
  (function() {
    var target = ${JSON.stringify(autoRedirectUrl)};
    setTimeout(function() {
      window.location.href = target;
    }, 600);
  })();
</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
