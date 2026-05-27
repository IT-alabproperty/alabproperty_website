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

export const supabase = createClient(url, anonKey)