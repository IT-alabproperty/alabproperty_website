import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Per-check timeout budgets. Different subsystems have different healthy
 * latencies and need different patience — pinning all to one value flags
 * "slow but ok" services as failures.
 *
 *  - DB / Storage / KV: same datacenter, p99 well under 500ms → 5s is plenty.
 *  - Resend / Telegram: public internet APIs, cold-start fetch + their own
 *    cold paths can tail-spike to 5-8s without anything being broken. We
 *    saw repeated Resend false-positives at 5s where the form itself was
 *    working fine — bumped to 10s so transient slowness doesn't page.
 *
 * All values are still well under the worker's 25s top-level timeout,
 * so a truly down service still produces a structured 503 with diag info
 * (instead of a generic "fetch aborted" with no detail).
 */
const FAST_CHECK_TIMEOUT_MS = 5_000
const SLOW_CHECK_TIMEOUT_MS = 10_000

/**
 * Structured result for one subsystem. `skipped` covers the dev/staging
 * case where an env var isn't set — we don't want a missing RESEND_API_KEY
 * to surface as "email is down" on someone's laptop. Skipped checks DON'T
 * fail the overall health.
 */
type CheckResult =
  | { ok: true; ms: number }
  | { ok: false; ms: number; error: string }
  | { skipped: true; reason: string }

/**
 * Aggregate health check endpoint. Used by the external Cloudflare Worker
 * monitor (see /monitoring/worker.js) and any other uptime probe.
 *
 * Runs all subsystem checks **in parallel** so the total response time is
 * bounded by the slowest single check, not the sum. Each check has its
 * own internal timeout so a hung dependency can't drag the whole endpoint
 * past the worker's deadline.
 *
 * Returns 200 if every non-skipped check passes; 503 if any failed.
 */
export async function GET() {
  const startedAt = Date.now()

  // Resend and Telegram get the slow-budget timeout because their public-
  // internet round-trips occasionally tail-spike past the fast budget
  // without anything actually being broken. See timeout constants above.
  const [supabaseResult, storageResult, resendResult, telegramResult, upstashResult] =
    await Promise.all([
      runCheck(checkSupabase, FAST_CHECK_TIMEOUT_MS),
      runCheck(checkSupabaseStorage, FAST_CHECK_TIMEOUT_MS),
      runCheck(checkResend, SLOW_CHECK_TIMEOUT_MS),
      runCheck(checkTelegram, SLOW_CHECK_TIMEOUT_MS),
      runCheck(checkUpstash, FAST_CHECK_TIMEOUT_MS),
    ])

  const checks: Record<string, CheckResult> = {
    supabase: supabaseResult,
    storage: storageResult,
    resend: resendResult,
    telegram: telegramResult,
    upstash: upstashResult,
  }

  // A check counts as "passing" if it's ok OR was skipped (missing env).
  // Skipping = informational, not a failure — otherwise dev environments
  // without every credential set would always look degraded.
  const allOk = Object.values(checks).every((c) => 'skipped' in c || c.ok)

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      uptimeMs: process.uptime ? Math.round(process.uptime() * 1000) : null,
      tookMs: Date.now() - startedAt,
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        // Never cache — uptime monitors must see real-time status.
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}

/**
 * Wrap a single check with timing, exception trapping, and a hard timeout.
 * The check function can throw, hang, return — all three end up as a
 * uniform CheckResult so the caller doesn't have to special-case anything.
 *
 * `timeoutMs` is per-call so faster subsystems aren't held to slow ones'
 * standards, and slow ones don't false-alert on transient tail latency.
 */
async function runCheck(
  fn: (timeoutMs: number) => Promise<CheckResult>,
  timeoutMs: number,
): Promise<CheckResult> {
  const t0 = Date.now()
  try {
    const timeoutPromise = new Promise<CheckResult>((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: false,
            ms: Date.now() - t0,
            error: `timeout after ${timeoutMs}ms`,
          }),
        timeoutMs,
      ),
    )
    return await Promise.race([fn(timeoutMs), timeoutPromise])
  } catch (e) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : 'unknown',
    }
  }
}

// ===== Individual checks =====
//
// Each check is a tiny, side-effect-free probe of one external dependency.
// Rules:
//   - Must return a CheckResult, never throw past `runCheck()`
//   - Must complete (or fail) within ~1s in the happy path
//   - Must NOT mutate anything (no test emails, no test messages)
//   - Must return `skipped` if its env vars aren't set

async function checkSupabase(_timeoutMs: number): Promise<CheckResult> {
  const t0 = Date.now()
  // Trivial query against a small public table. Tests three things at
  // once: TCP reachability, auth (anon key), and the SQL engine itself.
  // We don't apply timeout here — the runCheck wrapper races against
  // its own timeout promise, and supabase-js can't be cleanly aborted
  // mid-query anyway.
  const { error } = await supabase
    .from('taxonomy_cities')
    .select('slug', { count: 'exact', head: true })
    .limit(1)
  if (error) return { ok: false, ms: Date.now() - t0, error: error.message }
  return { ok: true, ms: Date.now() - t0 }
}

async function checkSupabaseStorage(timeoutMs: number): Promise<CheckResult> {
  const t0 = Date.now()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return { skipped: true, reason: 'NEXT_PUBLIC_SUPABASE_URL / ANON_KEY not set' }
  }
  const res = await fetch(`${url}/storage/v1/bucket`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    signal: AbortSignal.timeout(timeoutMs - 200),
  })
  if (!res.ok) {
    return { ok: false, ms: Date.now() - t0, error: `storage HTTP ${res.status}` }
  }
  return { ok: true, ms: Date.now() - t0 }
}

async function checkResend(timeoutMs: number): Promise<CheckResult> {
  const t0 = Date.now()
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { skipped: true, reason: 'RESEND_API_KEY not set' }

  // Probe approach: POST /emails with intentionally invalid body.
  //
  // Why not GET /domains: that endpoint requires "Full Access" permission.
  // Production keys at ALAB use the safer "Sending Access" permission
  // (least privilege — if the key leaks, attacker can only spam from our
  // domain, not enumerate/delete domains or other keys). Sending Access
  // keys get 401 with `restricted_api_key` on /domains — looks like a
  // dead key but is actually working fine.
  //
  // POST /emails is reachable by both permission tiers. Resend's auth
  // layer runs before body validation, so we get cleanly separable signals:
  //   - 401 → key truly rejected (revoked / wrong / expired)
  //   - 422 → key accepted, body failed validation (= service healthy)
  //   - 400 → same as 422 in some Resend versions
  //   - 5xx → Resend infrastructure problem
  //
  // Empty body is deliberately not a valid email — no message is queued.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(timeoutMs - 200),
  })

  // Auth failures = real failures. 4xx body-validation errors are the
  // expected "healthy" response for this probe.
  if (res.status === 401 || res.status === 403) {
    return { ok: false, ms: Date.now() - t0, error: `resend HTTP ${res.status}` }
  }
  if (res.status >= 500) {
    return { ok: false, ms: Date.now() - t0, error: `resend HTTP ${res.status}` }
  }
  return { ok: true, ms: Date.now() - t0 }
}

async function checkTelegram(timeoutMs: number): Promise<CheckResult> {
  const t0 = Date.now()
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) return { skipped: true, reason: 'TELEGRAM_BOT_TOKEN not set' }
  // getMe = side-effect-free probe of the Bot API + our token.
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
    signal: AbortSignal.timeout(timeoutMs - 200),
  })
  if (!res.ok) {
    return { ok: false, ms: Date.now() - t0, error: `telegram HTTP ${res.status}` }
  }
  const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null
  if (!json?.ok) {
    return {
      ok: false,
      ms: Date.now() - t0,
      error: json?.description ?? 'telegram API returned ok:false',
    }
  }
  return { ok: true, ms: Date.now() - t0 }
}

async function checkUpstash(timeoutMs: number): Promise<CheckResult> {
  const t0 = Date.now()
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    return { skipped: true, reason: 'KV_REST_API_URL / KV_REST_API_TOKEN not set' }
  }
  const res = await fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs - 200),
  })
  if (!res.ok) {
    return { ok: false, ms: Date.now() - t0, error: `upstash HTTP ${res.status}` }
  }
  return { ok: true, ms: Date.now() - t0 }
}
