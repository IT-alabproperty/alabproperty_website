import { NextRequest, NextResponse } from 'next/server'
import { notifyTechAdmins } from '@/lib/notify-tech'
import { makeLimiter, rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public endpoint — error boundaries on the client call it without auth, so
// rate-limit by IP to stop abuse. 10 error reports per IP per minute is more
// than enough for a real human bumping into bugs; bots get 429.
const limiter = makeLimiter('client-error', 10, '1 m')

interface ClientErrorBody {
  message?: string
  stack?: string
  digest?: string
  path?: string
  source?: 'global-error' | 'error-boundary'
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rl = await rateLimit(limiter, ip)
  if (!rl.ok) {
    // Silently accept — we never want the error boundary itself to error out
    // visibly to the user just because the channel is throttled.
    return NextResponse.json({ ok: true, throttled: true })
  }

  let body: ClientErrorBody = {}
  try { body = await req.json() } catch { /* tolerate empty body */ }

  const message = typeof body.message === 'string' ? body.message.slice(0, 500) : '(empty client error)'
  const stack = typeof body.stack === 'string' ? body.stack.slice(0, 2000) : undefined
  const path = typeof body.path === 'string' ? body.path.slice(0, 200) : undefined
  const source = body.source === 'global-error' ? 'client/global-error' : 'client/error-boundary'

  await notifyTechAdmins('error', {
    source,
    message,
    detail: stack,
    path,
  })

  return NextResponse.json({ ok: true })
}
