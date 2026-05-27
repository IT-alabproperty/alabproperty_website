import { createClient } from '@supabase/supabase-js'

const url = (
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
).replace(/\/$/, '')
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? ''

if (!url) {
  console.warn('[supabase-admin] SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required')
}
if (!serviceKey) {
  console.warn('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE is required')
}

export const supabaseAdmin = createClient(url, serviceKey)
