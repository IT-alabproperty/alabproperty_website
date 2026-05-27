import { supabaseAdmin } from './supabase-admin'
import { makeLimiter, rateLimit } from './rate-limit'
import { scrubTokens } from './log-safe'

/**
 * Send a technical-error alert to every bot_user whose role subscribes to the
 * `technical_errors` notify topic. Falls back to TELEGRAM_CHAT_ID env when no
 * subscribers exist.
 *
 * De-duplication: identical alerts within a 15-minute window are dropped via
 * Upstash. Without this, a single broken upstream would page the whole team
 * with thousands of identical messages.
 */
export type Severity = 'error' | 'warn' | 'critical'

interface NotifyContext {
  /** Where in code the error fired — e.g. '/api/leads' or 'global-error'. */
  source: string
  /** Human summary; first 200 chars get fingerprinted for de-dup. */
  message: string
  /** Stack trace or extra context. Token-scrubbed before send. */
  detail?: string
  /** HTTP path that triggered the error, if applicable. */
  path?: string
}

// 1 alert per fingerprint per 15 minutes. Counter is per-source+message hash —
// different errors still notify, identical ones are throttled.
const dedupLimiter = makeLimiter('tech-alert', 1, '15 m')

const EMOJI: Record<Severity, string> = {
  warn: '⚠️',
  error: '🛑',
  critical: '🚨',
}

function fingerprint(source: string, message: string): string {
  // Short stable hash. Collisions are fine — they just mean *more* dedup.
  let h = 0
  const seed = `${source}::${message.slice(0, 200)}`
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function escapeMd(s: string): string {
  // Telegram MarkdownV1 — same escape rule we use in lead notifications.
  return String(s).replace(/([_*`\[\]])/g, '\\$1')
}

interface BotUserRow {
  telegram_id: number
  notification_lang: 'ru' | 'en'
  role: { notify_topics?: string[] } | null
}

export async function notifyTechAdmins(severity: Severity, ctx: NotifyContext): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? ''
  if (!botToken || botToken.includes('xxxx')) {
    console.warn('[notify-tech] TELEGRAM_BOT_TOKEN not set — alert dropped:', ctx.source, ctx.message)
    return
  }

  // De-dup
  const fp = fingerprint(ctx.source, ctx.message)
  const dedup = await rateLimit(dedupLimiter, `tech:${fp}`)
  if (!dedup.ok) return  // we already sent this same alert recently

  // Find subscribers
  let chatIds: number[] = []
  try {
    const { data } = await supabaseAdmin
      .from('bot_users')
      .select('telegram_id, notification_lang, role:roles!inner(notify_topics)')
      .eq('active', true)
    if (data) {
      chatIds = (data as unknown as BotUserRow[])
        .filter((u) => Array.isArray(u.role?.notify_topics) && u.role!.notify_topics!.includes('technical_errors'))
        .map((u) => Number(u.telegram_id))
        .filter((id) => Number.isFinite(id) && id !== 0)
    }
  } catch (e) {
    console.error('[notify-tech] failed to load subscribers:', scrubTokens(e))
  }

  // Fallback to env-configured single chat ID.
  if (chatIds.length === 0) {
    const fallback = process.env.TELEGRAM_CHAT_ID?.trim() ?? ''
    const chatId = Number(fallback)
    if (fallback && Number.isFinite(chatId)) {
      chatIds = [chatId]
    } else if (fallback) {
      console.warn('[notify-tech] TELEGRAM_CHAT_ID provided but invalid — alert dropped')
    }
  }
  if (chatIds.length === 0) {
    console.warn('[notify-tech] no recipients — alert dropped')
    return
  }

  const lines = [
    `${EMOJI[severity]} *${severity.toUpperCase()}* · \`${escapeMd(ctx.source)}\``,
    ``,
    escapeMd(ctx.message.slice(0, 1000)),
  ]
  if (ctx.path) lines.push(``, `*Path:* \`${escapeMd(ctx.path)}\``)
  if (ctx.detail) {
    const safeDetail = scrubTokens(ctx.detail).slice(0, 1500)
    lines.push(``, '```', safeDetail, '```')
  }
  lines.push(``, `_at ${new Date().toISOString()}_`)
  const text = lines.join('\n')

  await Promise.allSettled(
    chatIds.map(async (chat_id) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const detail = await res.text().catch(() => '')
          console.error('[notify-tech] telegram non-200:', chat_id, res.status, scrubTokens(detail))
        }
      } catch (e) {
        console.error('[notify-tech] telegram fetch failed:', chat_id, scrubTokens(e))
      } finally {
        clearTimeout(timeout)
      }
    }),
  )
}
