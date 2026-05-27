import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

  // Supabase reachability — issue a trivial query against a small public table.
  try {
    const t0 = Date.now()
    const { error } = await supabase
      .from('taxonomy_cities')
      .select('slug', { count: 'exact', head: true })
      .limit(1)
    checks.supabase = {
      ok: !error,
      ms: Date.now() - t0,
      error: error?.message,
    }
  } catch (e) {
    checks.supabase = { ok: false, ms: 0, error: e instanceof Error ? e.message : 'unknown' }
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
