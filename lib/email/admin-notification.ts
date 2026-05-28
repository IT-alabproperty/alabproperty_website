export function renderAdminLeadNotification(lead: {
  name: string
  email: string
  phone?: string | null
  preferredContact?: string | null
  message?: string | null
  propertyTitle?: string | null
  propertySlug?: string | null
  cryptoPayment?: boolean
  locale?: string | null
}) {
  const subject = `🔔 New Lead${lead.propertyTitle ? `: ${lead.propertyTitle}` : ''} — ${lead.name}`
  const propertyLink = lead.propertySlug
    ? `https://alabproperty.com/properties/${lead.propertySlug}`
    : null
  const dateBangkok = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  const row = (label: string, value: string | null | undefined, href?: string | null) => {
    if (!value) return ''
    const cell = href
      ? `<a href="${escapeHtml(href)}" style="color:#A8882F;text-decoration:none">${escapeHtml(value)}</a>`
      : `<span style="color:#2B1810">${escapeHtml(value)}</span>`
    return `<tr>
      <td style="padding:10px 0;font-size:11px;color:#8A7868;text-transform:uppercase;letter-spacing:0.14em;width:42%;vertical-align:top;border-bottom:1px solid #EDE6D9">${escapeHtml(label)}</td>
      <td style="padding:10px 0;font-size:14px;font-weight:500;border-bottom:1px solid #EDE6D9">${cell}</td>
    </tr>`
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:24px 12px;background:#F5EFE6;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#2B1810">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #EDE6D9">
      <tr>
        <td style="padding:28px 32px 22px;background:#FBF8F2;border-bottom:2px solid #C9A961">
          <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#A8882F;font-weight:600;margin-bottom:10px">New Lead</div>
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#2B1810;line-height:1.1">${escapeHtml(lead.name)}</div>
          <div style="margin-top:8px;font-size:13px;color:#5C3A26">${escapeHtml(dateBangkok)} · Bangkok</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 8px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
            ${row('Email', lead.email, `mailto:${lead.email}`)}
            ${row('Phone', lead.phone, lead.phone ? `tel:${lead.phone}` : null)}
            ${row('Preferred contact', lead.preferredContact)}
            ${row('Property', lead.propertyTitle, propertyLink)}
            ${lead.cryptoPayment ? row('Crypto payment', 'Yes') : ''}
            ${row('Locale', lead.locale)}
          </table>
        </td>
      </tr>
      ${lead.message ? `<tr>
        <td style="padding:18px 32px 8px">
          <div style="padding:16px 18px;background:#FBF8F2;border-left:3px solid #C9A961;border-radius:6px">
            <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7868;margin-bottom:8px;font-weight:600">Message</div>
            <div style="font-size:14px;line-height:1.6;color:#2B1810;white-space:pre-wrap">${escapeHtml(lead.message)}</div>
          </div>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:20px 32px 28px">
          <a href="mailto:${escapeHtml(lead.email)}"
             style="display:inline-block;padding:13px 26px;border-radius:9999px;background:#2B1810;color:#F5EFE6;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase">Reply by email</a>
          ${propertyLink ? `&nbsp;&nbsp;<a href="${escapeHtml(propertyLink)}"
             style="display:inline-block;padding:13px 26px;border-radius:9999px;border:1px solid #C9A961;color:#A8882F;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase">View property</a>` : ''}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;background:#FBF8F2;border-top:1px solid #EDE6D9;font-size:11px;color:#8A7868;text-align:center;letter-spacing:0.08em">
          ALAB Property &middot; internal notification
        </td>
      </tr>
    </table>
  </body>
</html>`

  const lines = [
    `🔔 New Lead`,
    ``,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : null,
    `Preferred contact: ${lead.preferredContact || 'email'}`,
    lead.propertyTitle ? `Property: ${lead.propertyTitle}` : null,
    propertyLink ? `Property link: ${propertyLink}` : null,
    lead.cryptoPayment ? `Crypto payment: Yes` : null,
    lead.locale ? `Locale: ${lead.locale}` : null,
    ``,
    `Message:`,
    lead.message || '(empty)',
    ``,
    `Date: ${dateBangkok} Bangkok`,
  ].filter(Boolean)

  return { subject, html, text: lines.join('\n') }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
