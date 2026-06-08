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
    // Failure context — populated whenever something's wrong so the Telegram
    // alert can say which subsystem broke and what the user-visible impact is.
    // See `summariseFailure()` for the mapping. Shape:
    //   { component, problem, impact, raw }
    let failure = null;

    try {
      const res = await fetch(url, {
        cf: { cacheTtl: 0, cacheEverything: false },
        // 25s timeout. Vercel cold-start (1-3s) + Supabase round-trip
        // (50-300ms) can occasionally tail-spike to 5-8s without anything
        // being actually broken. A genuine outage takes well over 25s
        // before recovery, so this threshold keeps false-positives at zero
        // while still paging within ~30s of a real incident.
        signal: AbortSignal.timeout(25_000),
      });
      httpCode = res.status;
      if (res.ok) {
        // 200 means Next responded. Parse JSON to distinguish ok vs degraded
        // (degraded = DB/Supabase down even though Next itself is alive).
        const data = await res.json().catch(() => null);
        current = data && data.status === 'ok' ? 'up' : 'degraded';
        if (current === 'degraded') {
          failure = summariseFailure({ kind: 'health-degraded', checks: data?.checks });
        }
      } else if (httpCode === 503) {
        // Health endpoint returned 503 — its internal check failed. We can
        // still read the JSON body for the breakdown.
        current = 'down';
        const data = await res.json().catch(() => null);
        failure = summariseFailure({ kind: 'health-503', checks: data?.checks });
      } else {
        current = 'down';
        const body = await res.text().catch(() => '');
        failure = summariseFailure({ kind: 'http-error', httpCode, body });
      }
    } catch (e) {
      current = 'down';
      failure = summariseFailure({ kind: 'fetch-failed', message: e?.message });
    }

    const tookMs = Date.now() - startedAt;
    const last = (await env.STATE.get('lastStatus')) || 'up';

    // Only alert when status changes. Saves you from getting paged 12 times
    // an hour while you're already fixing the outage.
    //
    // NOTE: this is the ONLY place we write to KV — once per status transition.
    // We used to also write a `lastCheckAt` on every tick for a debug endpoint;
    // that burned 1440 writes/day (over the 1000/day free tier). Restore it
    // only if you build the debug endpoint AND upgrade to Workers Paid.
    if (current !== last) {
      // For recovery alerts, compute how long the outage lasted and surface
      // the original failure reason — alerts then carry their own narrative
      // ("DB timed out for 1m 55s") instead of just "site recovered".
      let downSinceMs = null;
      let lastFailureSummary = null;
      if (current === 'up') {
        const downSinceIso = await env.STATE.get('downSince');
        if (downSinceIso) {
          const t = Date.parse(downSinceIso);
          if (Number.isFinite(t)) downSinceMs = Date.now() - t;
        }
        lastFailureSummary = await env.STATE.get('lastFailureSummary');
      } else {
        // Going from up → down/degraded. Record when so the recovery alert
        // can show duration.
        await env.STATE.put('downSince', new Date().toISOString());
        if (failure) {
          await env.STATE.put('lastFailureSummary', JSON.stringify(failure));
        }
      }

      await env.STATE.put('lastStatus', current);
      await env.STATE.put('lastChangeAt', new Date().toISOString());

      await sendTelegram(env, {
        current,
        previous: last,
        httpCode,
        failure,
        recoveredFromSummary: lastFailureSummary
          ? safeJsonParse(lastFailureSummary)
          : null,
        downSinceMs,
        url,
        tookMs,
      });

      // Clear stale state after a successful recovery so the NEXT down event
      // doesn't accidentally inherit it.
      if (current === 'up') {
        await env.STATE.delete('downSince');
        await env.STATE.delete('lastFailureSummary');
      }
    }
  },
};

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * Turn a raw failure signal (degraded JSON / 503 body / HTTP error / fetch
 * exception) into a structured `{ component, problem, impact }` triple that
 * reads naturally in a Telegram alert.
 *
 * Adding a new check to /api/health? Map it here so admins see "DB" or
 * "Email gateway" instead of a JSON blob.
 */
function summariseFailure(input) {
  // Health endpoint says degraded (200 ok or 503) — look for the failing
  // check by name. We use a small lookup so each known component renders
  // with both a human label and a "what does this break for visitors?"
  // impact line.
  const KNOWN = {
    supabase: {
      component: 'Database (Supabase)',
      impactByError: (err) => {
        if (/timeout/i.test(err || '')) {
          return 'Property catalog, blog, search and admin reads all blocked while DB is unreachable.';
        }
        return 'DB queries failing — most pages that load content will 503 or show empty state.';
      },
    },
    // Future: add { storage, email, redis, ... } entries here as more checks
    // get added to /api/health.
  };

  if (input.kind === 'health-degraded' || input.kind === 'health-503') {
    const checks = input.checks || {};
    const failing = Object.entries(checks).find(([, v]) => v && v.ok === false);
    if (failing) {
      const [name, check] = failing;
      const known = KNOWN[name];
      const errorText = check.error || `${name} check returned not-ok`;
      return {
        component: known?.component ?? name,
        problem: errorText,
        impact: known?.impactByError
          ? known.impactByError(check.error)
          : 'Pages depending on this subsystem will fail until it recovers.',
        raw: checks,
      };
    }
    return {
      component: 'Health endpoint',
      problem: 'Returned degraded status with no failing checks identified',
      impact: 'Unclear blast radius — investigate /api/health manually.',
      raw: checks,
    };
  }

  if (input.kind === 'http-error') {
    return {
      component: 'Site frontend (Vercel)',
      problem: `Health endpoint returned HTTP ${input.httpCode}`,
      impact:
        input.httpCode >= 500
          ? 'Server-side crash — visitors likely hitting 500-level errors across the site.'
          : 'Routing/auth issue at the edge — visitors may be redirected or blocked.',
      raw: input.body ? input.body.slice(0, 200) : undefined,
    };
  }

  if (input.kind === 'fetch-failed') {
    const msg = input.message || 'unknown';
    const isTimeout = /timeout|aborted/i.test(msg);
    return {
      component: 'Site frontend (Vercel)',
      problem: isTimeout
        ? 'No response within 25s — Vercel function hung or worker→Vercel network unreachable'
        : `Fetch failed: ${msg}`,
      impact: 'Whole site appears down to visitors. Check Vercel deployment status.',
    };
  }

  return null;
}

/**
 * Format a millisecond duration the way a human would say it out loud.
 * "65s" instead of "65000ms", "1m 5s" instead of "65s", "1h 12m" once we
 * hit hour range. Used in recovery alerts to show outage length.
 */
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

async function sendTelegram(env, info) {
  const emoji =
    info.current === 'up' ? '✅' :
    info.current === 'degraded' ? '⚠️' : '🚨';

  const heading =
    info.current === 'up' ? 'SITE RECOVERED' :
    info.current === 'degraded' ? 'SITE DEGRADED' : 'SITE DOWN';

  const lines = [`${emoji} *${heading}*`, ''];

  // Down / degraded — lead with the human story, push the diagnostic JSON
  // to the bottom for engineers who want it.
  if (info.failure) {
    lines.push(`*What broke:* ${escapeMd(info.failure.component)}`);
    lines.push(`*Why:* ${escapeMd(info.failure.problem)}`);
    lines.push(`*Impact:* ${escapeMd(info.failure.impact)}`);
    lines.push('');
  }

  // Recovery — show how long things were broken, plus what was wrong
  // (pulled from KV state we wrote when going down).
  if (info.current === 'up') {
    if (Number.isFinite(info.downSinceMs)) {
      lines.push(`*Was down for:* ${formatDuration(info.downSinceMs)}`);
    }
    if (info.recoveredFromSummary?.component) {
      lines.push(`*Previous problem:* ${escapeMd(info.recoveredFromSummary.component)} — ${escapeMd(info.recoveredFromSummary.problem || '')}`);
    }
    lines.push('');
  }

  // Technical block — kept for engineers but visually de-emphasised.
  lines.push(`\`transition:\` ${info.previous} → ${info.current}`);
  lines.push(`\`http:\` ${info.httpCode || '—'} · \`latency:\` ${info.tookMs}ms`);
  lines.push(`\`url:\` ${info.url}`);

  // Raw JSON dump for power-users (only when there's useful structure).
  if (info.failure?.raw && typeof info.failure.raw === 'object') {
    const json = JSON.stringify(info.failure.raw, null, 2);
    if (json.length <= 600) {
      lines.push('', '```json', json, '```');
    }
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

/**
 * Escape Telegram-Markdown special characters in interpolated values so a
 * stray underscore or asterisk in an error message doesn't break the
 * formatting (or in the worst case, break Telegram's parser and reject the
 * whole alert).
 */
function escapeMd(s) {
  if (s == null) return '';
  return String(s).replace(/([_*`\[\]])/g, '\\$1');
}
