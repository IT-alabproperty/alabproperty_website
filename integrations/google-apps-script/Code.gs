/**
 * ALAB Property — Google Apps Script webhook.
 *
 * Single HTTP entry point used by the Next.js backend for TWO unrelated jobs
 * (both have to be in one script because Apps Script's Web App only takes
 * one POST handler per deployment):
 *
 *   1. Append a new lead to the Sheets tab (default action).
 *   2. Create a Gmail draft addressed to a lead, return its URL so the
 *      admin can open it in one click from the Telegram notification.
 *
 * Why Apps Script and not Gmail OAuth + googleapis: zero Cloud Console
 * setup, zero billed APIs, free forever, and the secret never leaves your
 * Google account. Trade-off: cold-starts take 5-15 s sometimes — which is
 * why the Next.js side uses a 25 s timeout when calling this.
 *
 * Setup steps live in README.md next to this file.
 */

// ============================================================
// CONFIG
// ============================================================

/**
 * Shared secret. The Next.js backend sends this in every POST body, and we
 * reject anything that doesn't match. Anyone who finds the Web App URL by
 * accident can still hit it — but without the secret they can't do
 * anything useful.
 *
 * Pick something long and random (40+ chars). Don't commit the real value
 * to git — replace this placeholder in the deployed copy only.
 *
 * Match this exactly with `GOOGLE_SHEETS_WEBHOOK_SECRET` in Vercel.
 */
const SECRET = 'REPLACE_ME_WITH_LONG_RANDOM_STRING'

// Header row written to a new tab on first append. Order MUST match
// the array shape returned by `buildRow()` in `lib/sheets/leads.ts`.
const HEADERS = [
  'Date (Bangkok)',
  'Name',
  'Email',
  'Phone',
  'Preferred contact',
  'Property',
  'Property link',
  'Crypto',
  'Message',
  'Locale',
]

// ============================================================
// ENTRY POINT
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)

    // Auth gate. Cheap, runs first, rejects everything else.
    if (data.secret !== SECRET) {
      return json({ ok: false, error: 'forbidden' })
    }

    // Action dispatch. Default = append (back-compat with older callers
    // that don't send an action field).
    const action = data.action || 'append'
    if (action === 'gmail-draft') return handleGmailDraft(data)
    if (action === 'append') return handleAppend(data)

    return json({ ok: false, error: 'unknown action: ' + action })
  } catch (err) {
    // Apps Script gobbles uncaught errors → caller sees an empty 200 and
    // has no idea what went wrong. Always return structured JSON.
    return json({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}

// Optional: handy for opening the Web App URL in browser to verify it's
// deployed. Returns "alive" plaintext — Next.js never calls this.
function doGet() {
  return ContentService.createTextOutput('alive')
    .setMimeType(ContentService.MimeType.TEXT)
}

// ============================================================
// HANDLERS
// ============================================================

/**
 * Append one row to the active spreadsheet's "Leads" tab (or whichever
 * tab was passed in `data.tab`). Auto-creates the tab and writes a header
 * row on first append, so a fresh sheet "just works".
 */
function handleAppend(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const tabName = data.tab || 'Leads'
  var sheet = ss.getSheetByName(tabName)
  if (!sheet) sheet = ss.insertSheet(tabName)

  // Lazy header init. We only ever write headers once — when the sheet is
  // brand new and `getLastRow()` returns 0. Existing sheets aren't touched.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS)
    sheet.setFrozenRows(1)
  }

  if (!Array.isArray(data.row)) {
    return json({ ok: false, error: 'row is missing or not an array' })
  }
  sheet.appendRow(data.row)
  return json({ ok: true })
}

/**
 * Create a Gmail draft addressed to the lead. Returns a URL the admin can
 * follow from the Telegram inline button — Gmail opens with the draft
 * pre-loaded for editing/sending.
 */
function handleGmailDraft(data) {
  if (!data.to) return json({ ok: false, error: 'to is required' })
  if (!data.subject) return json({ ok: false, error: 'subject is required' })

  // text fallback is required by Gmail; htmlBody is the rendered version.
  const draft = GmailApp.createDraft(
    data.to,
    data.subject,
    data.text || '',
    { htmlBody: data.html || data.text || '' },
  )

  // Try to get the thread id so we can deep-link the admin straight into
  // the draft for editing. If anything goes wrong here we fall back to
  // the drafts folder — admin sees their new draft on top.
  var url = 'https://mail.google.com/mail/u/0/#drafts'
  try {
    const thread = draft.getMessage().getThread()
    const threadId = thread.getId()
    if (threadId) url = 'https://mail.google.com/mail/u/0/#drafts/' + threadId
  } catch (e) {
    // Some draft shapes don't have a thread until they're modified — fine,
    // fall through to the generic drafts URL.
  }
  return json({ ok: true, url: url })
}

// ============================================================
// UTILS
// ============================================================

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
