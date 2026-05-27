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

export const supabaseAdmin = createClient(url, serviceKey)
