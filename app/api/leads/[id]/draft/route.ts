import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { renderAgentReply } from '@/lib/email/agent-reply'
import { verifyLeadToken } from '@/lib/lead-tokens'

/**
 * GET /api/leads/[id]/draft?t=<HMAC>
 *
 * Clicked from the "Reply in Gmail" button on a Telegram lead notification.
 *
 * Returns an HTML interstitial page that:
 *   1. Auto-tries the iOS/Android Gmail app deep link (`googlegmail://co?...`)
 *      so the editor lands directly in compose with the reply pre-filled.
 *   2. Falls back to Gmail Web compose (`mail.google.com/?view=cm&fs=1&...`)
 *      after a short timeout if the app isn't installed.
 *   3. Always shows both buttons visibly, so even when Telegram's in-app
 *      browser blocks the auto-deeplink, the editor can pick one click.
 *
 * Body content is plain text (URL-encoded), not HTML — that's a constraint
 * of both the `googlegmail://` and Gmail web `?body=` schemes. The reply
 * template stays the same, we just send the text variant.
 *
 * Previously this route called the Apps Script webhook to create a
 * server-side draft, then redirected to `mail.google.com/#drafts/{id}`.
 * Two problems with that approach:
 *   - Gmail's drafts URL opens the drafts FOLDER with the thread selected —
 *     not the compose window. The editor had to tap once more.
 *   - Inside Telegram's in-app browser the redirect chain often stalled or
 *     was intercepted, leaving the editor staring at a blank page.
 * The deep-link approach sidesteps both: no server-side draft, no
 * mail.google.com 302 chain, just a one-shot URL the OS knows what to
 * do with.
 */

const APP_NAME = 'ALAB Property'

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

/** Minimal HTML escaping for values interpolated into the response body. */
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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

  if (!lead.email) {
    return errorPage(
      'No email on lead',
      `The lead doesn't have an email saved — can&apos;t open a reply window. Check the row in Supabase or contact the visitor via phone if you have it.`,
      400,
    )
  }

  // Reply in the same language the visitor wrote in. Older rows (created
  // before the `leads.locale` column was added) have null → fall back to RU.
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

  // Cap body length. Gmail's web compose URL works up to ~2KB total; the
  // app deep-link is more generous but we cap at the same conservative
  // limit so the same string fits in both. Long property descriptions
  // would otherwise truncate awkwardly.
  const MAX_BODY = 1500
  const bodyText =
    tpl.text.length > MAX_BODY ? tpl.text.slice(0, MAX_BODY - 3) + '…' : tpl.text

  const to = encodeURIComponent(lead.email)
  const subjectEnc = encodeURIComponent(tpl.subject)
  const bodyEnc = encodeURIComponent(bodyText)

  // Gmail iOS/Android app deep link. `co` = compose. Uses `subject` (full
  // word) — different from the web URL which uses `su`.
  const appUrl = `googlegmail://co?to=${to}&subject=${subjectEnc}&body=${bodyEnc}`

  // Gmail Web compose URL — works in browsers (including Telegram in-app),
  // mobile and desktop. `view=cm` puts compose in pop-up mode, `fs=1` makes
  // it full-screen so there's no missing-window edge case.
  const webUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subjectEnc}&body=${bodyEnc}`

  // i18n string blobs — minimal, just for this single page.
  const t = isRu
    ? {
        title: 'Открываю Gmail',
        replyTo: 'Ответ для',
        appBtn: 'Открыть в приложении Gmail',
        webBtn: 'Открыть в браузере',
        note: 'Если приложение не открылось — нажми «Открыть в браузере».',
      }
    : {
        title: 'Opening Gmail',
        replyTo: 'Reply to',
        appBtn: 'Open in Gmail app',
        webBtn: 'Open in browser',
        note: `If the app didn&apos;t open, tap "Open in browser".`,
      }

  const recipient = escapeHtml(lead.name || lead.email)

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
  .note {
    margin-top: 16px;
    font-size: 11px; line-height: 1.5;
    color: rgba(245,239,230,0.45);
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
  <a href="${appUrl}" class="btn btn-primary">${escapeHtml(t.appBtn)}</a>
  <a href="${webUrl}" target="_blank" rel="noopener" class="btn btn-secondary">${escapeHtml(t.webBtn)}</a>
  <p class="note">${t.note}</p>
</div>
<script>
  // Auto-try the Gmail app deep link once the page renders. If the app is
  // installed, the OS hands off to it and we're done. If not, the iframe
  // approach below silently fails — no popup, no broken-link error — and
  // the user can use the visible buttons.
  //
  // Why iframe instead of direct location: setting top-level location
  // to a custom scheme triggers a "page can't be opened" alert on some
  // platforms when the scheme isn't registered. iframe-based deep-link
  // attempts are silent and widely compatible.
  //
  // After ~1.5s, if the document is still visible (the OS didn't hand off
  // to Gmail), fall through to the web URL. visibilitychange tells us
  // when the user has left for the app.
  (function() {
    var appUrl = ${JSON.stringify(appUrl)};
    var webUrl = ${JSON.stringify(webUrl)};
    var handed = false;
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) handed = true;
    });
    setTimeout(function() {
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      setTimeout(function() { try { iframe.remove(); } catch(_) {} }, 200);
    }, 80);
    setTimeout(function() {
      if (!handed && !document.hidden) {
        window.location.href = webUrl;
      }
    }, 1500);
  })();
</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Always fresh — the URL contains a per-lead HMAC token; never let an
      // intermediate cache serve a stale page for a different lead.
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
