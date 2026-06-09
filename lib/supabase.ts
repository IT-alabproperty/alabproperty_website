import { createClient } from '@supabase/supabase-js'

// Normalize URL: remove trailing slash and accidental `/rest/v1` suffix
const rawUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
let url = ''
if (rawUrl) {
  try {
    url = new URL(rawUrl).toString()
  } catch {
    console.warn('[supabase] invalid SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL:', rawUrl)
  }
}
url = url.replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '')
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

// Hard ceiling on every supabase-js HTTP call. Without this the SDK uses the
// platform default `fetch` which has NO timeout — a hung PostgREST or storage
// node holds the request open until the Vercel function deadline (10-60s).
// During the 2026-06-09 Supabase outages (5s DB timeout + 5s Storage timeout
// in /api/health), real SSR pages would otherwise have waited tens of seconds
// before 504-ing. 8s is well above Supabase's healthy p99 (<500ms) but well
// below Vercel's default function timeout, so genuine slowness aborts cleanly
// and a retry/empty-state path can render.
const SUPABASE_FETCH_TIMEOUT_MS = 8_000

const fetchWithTimeout: typeof fetch = (input, init) => {
  const signals: AbortSignal[] = [AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS)]
  if (init?.signal) signals.push(init.signal)
  return fetch(input, { ...init, signal: AbortSignal.any(signals) })
}

export const supabase = createClient(url, anonKey, {
  global: { fetch: fetchWithTimeout },
})
