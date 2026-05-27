/**
 * ALAB Property — external uptime monitor running on Cloudflare Workers.
 *
 * Fires every N minutes (cron trigger in wrangler.jsonc), pings the site's
 * /api/health, and reports state transitions to Telegram. Lives outside the
 * main Next.js app on purpose: if Vercel goes down entirely, this still runs.
 *
 * State (last known up/degraded/down) is persisted in Cloudflare KV so we
 * only alert on TRANSITIONS — not every minute while the site is down.
 *
 * Required env (set via `wrangler secret put`):
 *   TG_BOT_TOKEN — Telegram bot token
 *   TG_CHAT_ID   — chat that receives alerts (your personal id)
 *   HEALTH_URL   — full URL to /api/health, e.g. https://alabproperty.com/api/health
 *
 * Required binding (wrangler.jsonc):
 *   STATE — KV namespace for last-known status
 */
export default {
  async scheduled(event, env, ctx) {
    const url = env.HEALTH_URL;
    if (!url || !env.TG_BOT_TOKEN || !env.TG_CHAT_ID) {
      console.error('[monitor] missing env (HEALTH_URL / TG_BOT_TOKEN / TG_CHAT_ID)');
      return;
    }

    const startedAt = Date.now();
    let current = 'unknown';
    let httpCode = 0;
    let detail = '';

    try {
      const res = await fetch(url, {
        cf: { cacheTtl: 0, cacheEverything: false },
        // 10s timeout — beyond that the site is effectively down for users.
        signal: AbortSignal.timeout(10_000),
      });
      httpCode = res.status;
      if (res.ok) {
        // 200 means Next responded. Parse JSON to distinguish ok vs degraded
        // (degraded = DB/Supabase down even though Next itself is alive).
        const data = await res.json().catch(() => null);
        current = data && data.status === 'ok' ? 'up' : 'degraded';
        if (current === 'degraded') {
          detail = JSON.stringify(data?.checks ?? {}, null, 2).slice(0, 600);
        }
      } else {
        current = 'down';
        const body = await res.text().catch(() => '');
        detail = body.slice(0, 400);
      }
    } catch (e) {
      current = 'down';
      detail = e && e.message ? e.message : 'fetch failed';
    }

    const tookMs = Date.now() - startedAt;
    const last = (await env.STATE.get('lastStatus')) || 'up';

    // Only alert when status changes. Saves you from getting paged 12 times
    // an hour while you're already fixing the outage.
    if (current !== last) {
      await env.STATE.put('lastStatus', current);
      await env.STATE.put('lastChangeAt', new Date().toISOString());
      await sendTelegram(env, {
        current,
        previous: last,
        httpCode,
        detail,
        url,
        tookMs,
      });
    }

    // Always record latest check timestamp — useful for a debug endpoint later.
    await env.STATE.put('lastCheckAt', new Date().toISOString());
  },
};

async function sendTelegram(env, info) {
  const emoji =
    info.current === 'up' ? '✅' :
    info.current === 'degraded' ? '⚠️' : '🚨';

  const heading =
    info.current === 'up' ? 'SITE RECOVERED' :
    info.current === 'degraded' ? 'SITE DEGRADED' : 'SITE DOWN';

  const lines = [
    `${emoji} *${heading}*`,
    '',
    `*Transition:* \`${info.previous}\` → \`${info.current}\``,
    `*HTTP:* ${info.httpCode || '—'}`,
    `*Latency:* ${info.tookMs}ms`,
    `*URL:* ${info.url}`,
  ];
  if (info.detail) {
    lines.push('', '```', info.detail.slice(0, 600), '```');
  }
  lines.push('', `_at ${new Date().toISOString()}_`);

  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TG_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });
}
