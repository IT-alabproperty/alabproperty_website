import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Per-check timeout. If Supabase doesn't answer in this window we treat it
// as "degraded" and return 503 immediately rather than hanging until the
// external uptime monitor's fetch timeout fires. Without this guard a single
// slow Supabase query (cold pool, regional blip) would surface as a generic
// "fetch aborted at 25s" alert with no diagnostic — exactly what happened on
// 2026-06-01 18:23 UTC. 5s is comfortably above p99 of a healthy round-trip
// (~300ms in this project) but well under the worker's 25s timeout, so a
// genuinely-degraded DB still produces a structured 503 the monitor can show.
const SUPABASE_CHECK_TIMEOUT_MS = 5_000

/**
 * Health check endpoint.
 *
 * Used by external uptime monitors (UptimeRobot etc.) to detect outages.
 * Returns 200 only when the site can actually serve real users — i.e. it
 * can reach Supabase. If DB is down we return 503 so the monitor pages
 * the team, instead of falsely reporting "site is up" because Next itself
 * responded.
 *
 * Kept lightweight (one indexed SELECT) so hitting it every 1-5 minutes
 * doesn't add measurable load.
 */
export async function GET() {
  const startedAt = Date.now()
  const checks: Record<string, { ok: boolean; ms: number; error?: string }> = {}

  // Supabase reachability — issue a trivial query against a small public table,
  // raced against an internal timeout so we never hang the response.
  const t0 = Date.now()
  try {
    const query = supabase
      .from('taxonomy_cities')
      .select('slug', { count: 'exact', head: true })
      .limit(1)
      .then(({ error }) => ({ kind: 'result' as const, error }))

    const timeout = new Promise<{ kind: 'timeout' }>((resolve) =>
      setTimeout(() => resolve({ kind: 'timeout' }), SUPABASE_CHECK_TIMEOUT_MS),
    )

    const outcome = await Promise.race([query, timeout])

    if (outcome.kind === 'timeout') {
      checks.supabase = {
        ok: false,
        ms: Date.now() - t0,
        error: `timeout after ${SUPABASE_CHECK_TIMEOUT_MS}ms`,
      }
    } else {
      checks.supabase = {
        ok: !outcome.error,
        ms: Date.now() - t0,
        error: outcome.error?.message,
      }
    }
  } catch (e) {
    checks.supabase = {
      ok: false,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : 'unknown',
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)

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
