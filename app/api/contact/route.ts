import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email, message } = await req.json();
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!email || !message) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

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
    return Response.json({ error: msg }, { status: 500 });
  }
}
