import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabase } from '@/lib/supabase'

/**
 * Записывает просмотр объекта.
 * Используется anon ключ + RLS-политика "anon_insert_views" — service_role не нужен.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const slug = typeof body?.slug === 'string' ? body.slug : null
    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    // IP из заголовков прокси (Vercel/CDN). Хешируем — сырой IP не храним.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
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
