import { createClient } from '@supabase/supabase-js'

// Normalize URL: remove trailing slash and accidental `/rest/v1` suffix
const rawUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const url = rawUrl.replace(/\/$/, '').replace(/\/rest\/v1\/?$/i, '')
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(url, anonKey)