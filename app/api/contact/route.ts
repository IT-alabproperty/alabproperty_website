import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { makeLimiter, rateLimit, clientIp } from '@/lib/rate-limit';

// 5 messages per IP per 10 minutes — same envelope as /api/leads. Anything
// more is almost certainly a bot.
const limiter = makeLimiter('contact', 5, '10 m');

const EMAIL_MAX = 200;
const MESSAGE_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    // Limiter outage shouldn't 500 the form — just let it through.
    let rl;
    try {
      rl = await rateLimit(limiter, ip);
    } catch {
      rl = { ok: true, retryAfter: 0, remaining: Infinity };
    }
    if (!rl.ok) {
      return Response.json(
        { error: 'too many requests, try again later' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return Response.json({ error: 'invalid json' }, { status: 400 });
    }

    if (!raw || typeof raw !== 'object') {
      return Response.json({ error: 'invalid body' }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX) {
      return Response.json({ error: 'invalid email' }, { status: 400 });
    }
    if (!message) {
      return Response.json({ error: 'message required' }, { status: 400 });
    }
    if (message.length > MESSAGE_MAX) {
      return Response.json({ error: `message too long (max ${MESSAGE_MAX})` }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
    if (!apiKey || apiKey.includes('xxxx')) {
      console.warn('[api/contact] RESEND_API_KEY not configured — message dropped');
      return Response.json({ ok: true });
    }

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'ALAB Property <noreply@alabproperty.com>',
      to: ['property@alabproperty.com'],
      replyTo: email,
      subject: `New website Letter from ${email}`,
      text: `From: ${email}\n\n${message}`,
    });

    return Response.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[contact error]', msg);
    return Response.json({ error: 'internal-error' }, { status: 500 });
  }
}
