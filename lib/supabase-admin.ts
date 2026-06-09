import { createClient } from '@supabase/supabase-js'

const rawUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
if (!rawUrl) {
  throw new Error('[supabase-admin] SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required')
}
let url: string
try {
  url = new URL(rawUrl).toString()
} catch {
  throw new Error(`[supabase-admin] Invalid SUPABASE_URL: ${rawUrl}`)
}
url = url.replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '')
const serviceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? ''
).trim()
if (!serviceKey) {
  throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE is required')
}

// See lib/supabase.ts for rationale — supabase-js has no built-in fetch
// timeout and a hung PostgREST would otherwise hold the Vercel function open
// until its top-level deadline. 8s is comfortably above healthy latency
// (<500ms p99) and well below Vercel's function timeout, so real slowness
// aborts cleanly instead of cascading into 504s.
const SUPABASE_FETCH_TIMEOUT_MS = 8_000

const fetchWithTimeout: typeof fetch = (input, init) => {
  const signals: AbortSignal[] = [AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS)]
  if (init?.signal) signals.push(init.signal)
  return fetch(input, { ...init, signal: AbortSignal.any(signals) })
}

export const supabaseAdmin = createClient(url, serviceKey, {
  global: { fetch: fetchWithTimeout },
})
