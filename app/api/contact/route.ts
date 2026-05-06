import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, message } = await req.json();

    if (!email || !message) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'ALAB Property Gate <onboarding@resend.dev>',
      to: 'property@alabproperty.com',
      replyTo: email,
      subject: `Сообщение с сайта от ${email}`,
      text: `От: ${email}\n\n${message}`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return Response.json({ error: 'Failed to send' }, { status: 500 });
  }
}
