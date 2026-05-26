/**
 * Replace anything that looks like a Telegram bot token with a redacted
 * placeholder before sending to logs. Tokens follow the shape
 * `<bot_id>:<secret>` where the secret is 35 base64-ish characters — long
 * enough to identify reliably with a regex even inside a longer stack trace.
 *
 * Always pipe untrusted strings through this before `console.error` —
 * stack traces from `fetch('https://api.telegram.org/bot{TOKEN}/...')` will
 * embed the token otherwise, and Vercel keeps logs for 30 days.
 */
export function scrubTokens(input: unknown): string {
  const str = typeof input === 'string' ? input : input instanceof Error ? `${input.message}\n${input.stack ?? ''}` : String(input)
  return str
    // Telegram bot tokens: digits, colon, 35-char secret
    .replace(/\b\d{6,12}:[A-Za-z0-9_-]{30,}\b/g, '***:***')
    // Supabase service-role JWTs (eyJ... three dot-separated base64 chunks)
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, 'eyJ***')
    // Resend API keys: re_xxxxxxxx
    .replace(/\bre_[A-Za-z0-9_]{10,}\b/g, 're_***')
    // Upstash tokens: long base64 with At... prefix used by KV
    .replace(/\bA[A-Za-z]{2}[A-Z0-9]{6}[A-Za-z0-9]{30,}\b/g, 'A***')
}
