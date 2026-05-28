export function renderReplyTemplate({
  name,
  inquiry,
  propertyTitle,
  propertyLink,
  locale = 'en',
}: {
  name: string
  inquiry: string
  propertyTitle?: string | null
  propertyLink?: string | null
  locale?: 'ru' | 'en'
}) {
  const subject = locale === 'en'
    ? (propertyTitle ? `Re: Your inquiry about ${propertyTitle}` : 'Re: Your inquiry with ALAB Property')
    : (propertyTitle ? `Re: Ваш запрос по объекту ${propertyTitle}` : 'Re: Ваш запрос в ALAB Property')
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root{--teak:#3A2418;--gold:#C9A961;--cream:#F5EFE6;--paper:#FBF8F2}
      body{font-family:Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;background:var(--paper);color:var(--teak);margin:0;padding:24px}
      .container{max-width:680px;margin:0 auto;background:linear-gradient(180deg,white, var(--paper));border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)}
      .header{padding:28px 32px;background:linear-gradient(90deg,var(--teak) 0%, #5C3A26 100%);color:var(--cream)}
      .brand{font-size:20px;font-weight:700}
      .body{padding:28px 32px}
      .lead{font-size:16px;margin:0 0 12px}
      .meta{font-size:14px;color:#666;margin-bottom:18px}
      .card{background:linear-gradient(180deg,var(--paper),#fff);border:1px solid #f0eee9;padding:16px;border-radius:8px;margin-bottom:18px}
      .cta{display:inline-block;padding:10px 16px;border-radius:8px;background:var(--gold);color:#fff;text-decoration:none;font-weight:600}
      .footer{padding:20px 32px;background:#fff;font-size:13px;color:#666}
      a{color:var(--gold)}
      @media (max-width:600px){.container{margin:0 12px} .header{padding:20px} .body{padding:20px}}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">ALAB Property</div>
      </div>
      <div class="body">
        <p class="lead">${locale === 'en' ? `Hello ${escapeHtml(name)},` : `Здравствуйте, ${escapeHtml(name)}!`}</p>
        <p class="meta">${locale === 'en' ? 'Thanks for your message — below is the lead you sent. Reply directly by clicking the button, or tweak the text before sending.' : 'Благодарим за обращение — ниже ваш запрос. Нажмите кнопку, чтобы ответить через Gmail.'}</p>
        <div class="card">
          <div style="font-weight:700;margin-bottom:6px">Inquiry</div>
          <div style="white-space:pre-wrap;color:var(--teak)">${escapeHtml(inquiry)}</div>
        </div>
        ${propertyTitle ? `<div class="card"><div style="font-weight:700;margin-bottom:6px">${locale === 'en' ? 'Property' : 'Объект'}</div><div><a href="${escapeHtml(propertyLink || '#')}">${escapeHtml(propertyTitle)}</a></div></div>` : ''}
        <p style="margin:0 0 18px">${locale === 'en' ? 'Warm regards,' : 'С уважением,'}<br/>ALAB Property Team</p>
        <a class="cta" href="mailto:property@alabproperty.com">${locale === 'en' ? 'Reply via email' : 'Ответить по почте'}</a>
      </div>
      <div class="footer">ALAB Property · <a href="https://alabproperty.com">alabproperty.com</a></div>
    </div>
  </body>
</html>`
  const text = locale === 'en'
    ? `Hello ${name}\n\nThank you for reaching out to ALAB Property.\n\n${inquiry}\n\nWarm regards,\nALAB Property Team`
    : `Здравствуйте, ${name}!\n\nБлагодарим за обращение в ALAB Property.\n\n${inquiry}\n\nС уважением,\nКоманда ALAB Property`
  return { subject, html, text }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
