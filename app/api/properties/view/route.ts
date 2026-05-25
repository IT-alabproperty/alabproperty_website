import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabase } from '@/lib/supabase'
import { makeLimiter, rateLimit, clientIp } from '@/lib/rate-limit'

// 30 views per IP per minute. Legit user clicks through a few cards then opens
// one detail page — they won't hit this. Anything above is a counter-pumping
// script and gets dropped (returns ok:true so we don't reveal the limit).
const limiter = makeLimiter('view', 30, '1 m')

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,119}$/

/**
 * Записывает просмотр объекта.
 * Используется anon ключ + RLS-политика "anon_insert_views" — service_role не нужен.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req)
    const rl = await rateLimit(limiter, ip)
    if (!rl.ok) {
      // Pretend we saved it — don't leak the rate-limit to scrapers.
      return NextResponse.json({ ok: true, throttled: true })
    }

    const body = await req.json().catch(() => ({}))
    const slug = typeof body?.slug === 'string' ? body.slug : null
    if (!slug || !SLUG_RE.test(slug)) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    // Хешируем IP — сырой IP не храним (PII).
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32)

    const locale = typeof body?.locale === 'string' ? body.locale.slice(0, 5) : null
    const referrer = req.headers.get('referer')?.slice(0, 500) ?? null
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

    const { error } = await supabase.from('property_views').insert({
      property_slug: slug,
      ip_hash: ipHash,
      locale,
      referrer,
      user_agent: userAgent,
    })

    if (error) {
      console.error('[api/properties/view] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/properties/view] failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
