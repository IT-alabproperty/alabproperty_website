export interface SheetsLeadRow {
  date: Date
  name: string
  email: string
  phone?: string | null
  preferredContact?: string | null
  propertyTitle?: string | null
  propertySlug?: string | null
  cryptoPayment?: boolean
  message?: string | null
  locale?: string | null
}

export const SHEETS_HEADER_ROW = [
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

function buildRow(row: SheetsLeadRow): string[] {
  const propertyLink = row.propertySlug
    ? `https://alabproperty.com/properties/${row.propertySlug}`
    : ''

  const dateBangkok = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(row.date)

  return [
    dateBangkok,
    row.name,
    row.email,
    row.phone || '',
    row.preferredContact || '',
    row.propertyTitle || '',
    propertyLink,
    row.cryptoPayment ? 'Yes' : '',
    row.message || '',
    row.locale || '',
  ]
}

export async function appendLeadRow(row: SheetsLeadRow): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim()
  if (!url) throw new Error('GOOGLE_SHEETS_WEBHOOK_URL missing')

  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || ''
  const tab = process.env.GOOGLE_SHEET_TAB?.trim() || 'Leads'

  const payload = {
    secret,
    tab,
    row: buildRow(row),
  }

  // Apps Script web apps respond after a 302 → script.googleusercontent.com hop
  // which can be slow (5-15s on cold start). 25s timeout gives it room without
  // blocking the lead handler indefinitely.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'follow',
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Apps Script webhook ${res.status}: ${detail.slice(0, 200)}`)
    }
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!json.ok) {
      throw new Error(`Apps Script returned: ${json.error || 'unknown'}`)
    }
  } catch (e) {
    // AbortError ≠ failure — the row often lands in the sheet even when our
    // client gave up. Re-throw as a tagged AbortError so the caller can decide
    // not to alert tech admins on this case.
    if (e instanceof Error && e.name === 'AbortError') {
      const err = new Error('Apps Script webhook timed out (write may still have succeeded)')
      err.name = 'SheetsTimeout'
      throw err
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }
}
