import { google } from 'googleapis'

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || ''
  const redirectUri = 'https://developers.google.com/oauthplayground'
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || ''
  if (!clientId || !clientSecret || !refreshToken) throw new Error('GMAIL OAuth2 env vars missing')

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  oAuth2Client.setCredentials({ refresh_token: refreshToken })
  return oAuth2Client
}

function base64UrlEncode(input: string | Buffer) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8')
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendGmail({
  from,
  to,
  subject,
  html,
  text,
}: {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
}) {
  const oAuth2Client = getOAuth2Client()
  const auth = oAuth2Client
  const gmail = google.gmail({ version: 'v1', auth })

  const boundary = '----=_Boundary_' + Date.now()
  const toHeader = Array.isArray(to) ? to.join(', ') : String(to)
  const plain = text || ''
  const htmlPart = html || ''

  const mimeLines = [
    `From: ${from}`,
    `To: ${toHeader}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plain,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlPart,
    '',
    `--${boundary}--`,
  ]

  const raw = mimeLines.join('\r\n')
  const encoded = base64UrlEncode(raw)

  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } })
  return res.data
}

export async function createGmailDraft({
  from,
  to,
  subject,
  html,
  text,
}: {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
}): Promise<{ draftId: string; messageId: string; threadId: string }> {
  const oAuth2Client = getOAuth2Client()
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

  const boundary = '----=_Boundary_' + Date.now()
  const toHeader = Array.isArray(to) ? to.join(', ') : String(to)
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`

  const mimeLines = [
    `From: ${from}`,
    `To: ${toHeader}`,
    `Subject: ${subjectEncoded}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html || '',
    '',
    `--${boundary}--`,
  ]

  const raw = mimeLines.join('\r\n')
  const encoded = base64UrlEncode(raw)

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw: encoded } },
  })

  const draftId = res.data.id || ''
  const messageId = res.data.message?.id || ''
  const threadId = res.data.message?.threadId || ''
  return { draftId, messageId, threadId }
}
