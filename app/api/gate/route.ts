import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const PASSWORD = process.env.SITE_PASSWORD ?? 'alab2026';
  const { password } = await req.json();
if (password !== PASSWORD) {
    return NextResponse.json({ error: 'wrong' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('alab_access', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
