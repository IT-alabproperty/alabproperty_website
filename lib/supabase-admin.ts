import { createClient } from '@supabase/supabase-js'

const rawUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const url = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '')
const serviceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? ''
).trim()

if (!url) {
  throw new Error('[supabase-admin] SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required')
}
if (!serviceKey) {
  throw new Error('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE is required')
}

export const supabaseAdmin = createClient(url, serviceKey)
