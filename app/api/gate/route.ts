import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { makeLimiter, rateLimit, clientIp } from '@/lib/rate-limit'

// 5 password attempts per IP per 15 minutes. Generous enough that a fat-fingered
// password retry doesn't lock you out, tight enough that brute-forcing a 30-char
// password becomes computationally hopeless.
const limiter = makeLimiter('gate', 5, '15 m')

/**
 * Constant-time password comparison. `password !== PASSWORD` leaks timing on a
 * per-character basis — irrelevant for short network round trips in practice,
 * but free best-practice via `timingSafeEqual`.
 */
function passwordMatches(input: string, expected: string): boolean {
  if (!expected) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rl = await rateLimit(limiter, ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'too many attempts, try later' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let password = ''
  try {
    const body = await req.json()
    if (typeof body?.password === 'string') password = body.password
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const expected = process.env.SITE_PASSWORD ?? ''
  if (!passwordMatches(password, expected)) {
    return NextResponse.json({ error: 'wrong' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('alab_access', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',  // HTTP localhost-friendly dev, HTTPS-only prod
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
