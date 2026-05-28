export function renderAgentReply({
  name,
  propertyTitle,
  propertyLink,
  locale = 'ru',
}: {
  name: string
  propertyTitle?: string | null
  propertyLink?: string | null
  locale?: 'ru' | 'en'
}) {
  const subject = locale === 'en'
    ? (propertyTitle ? `Re: Your inquiry about ${propertyTitle}` : 'Re: Your inquiry with ALAB Property')
    : (propertyTitle ? `Re: Ваш запрос по объекту ${propertyTitle}` : 'Re: Ваш запрос в ALAB Property')

  const greeting = locale === 'en'
    ? `Hello ${escapeHtml(name)},`
    : `Здравствуйте, ${escapeHtml(name)}!`

  const intro = locale === 'en'
    ? `Thank you for reaching out to ALAB Property. We've received your inquiry${propertyTitle ? ` about <strong>${escapeHtml(propertyTitle)}</strong>` : ''} and would like to walk you through the details personally.`
    : `Благодарим за обращение в ALAB Property. Мы получили ваш запрос${propertyTitle ? ` по объекту <strong>${escapeHtml(propertyTitle)}</strong>` : ''} и хотели бы предметно обсудить детали.`

  const next = locale === 'en'
    ? `One of our consultants will be in touch within 12 hours. In the meantime, feel free to reply with any preferred call time or additional questions.`
    : `Наш консультант свяжется с вами в течение 12 часов. Если удобно, ответьте на это письмо с подходящим временем для звонка или дополнительными вопросами.`

  const signOff = locale === 'en' ? 'Warm regards,' : 'С уважением,'
  const teamLine = locale === 'en' ? 'ALAB Property Team' : 'Команда ALAB Property'
  const propertyButtonLabel = locale === 'en' ? 'View property' : 'Открыть объект'
  const websiteLabel = locale === 'en' ? 'Visit website' : 'На сайт'

  const propertyBlock = propertyTitle && propertyLink
    ? `<tr><td style="padding:0 32px 24px">
         <a href="${escapeHtml(propertyLink)}"
            style="display:inline-block;padding:12px 24px;border-radius:9999px;background:#C9A961;color:#2B1810;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;font-family:Inter,Arial,sans-serif">
           ${propertyButtonLabel}
         </a>
       </td></tr>`
    : ''

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:24px 12px;background:#F5EFE6;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#2B1810">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;background:#FBF8F2;border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(43,24,16,0.12)">
      <tr>
        <td style="padding:36px 32px 24px;background:linear-gradient(135deg,#2B1810 0%,#3A2418 60%,#5C3A26 100%);color:#F5EFE6">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;letter-spacing:0.02em">ALAB <em style="color:#C9A961;font-style:italic">Property</em></div>
          <div style="margin-top:6px;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#C9A961">Bangkok · Thailand</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 32px 8px">
          <p style="margin:0 0 16px;font-size:18px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;color:#2B1810">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3A2418">${intro}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3A2418">${next}</p>
        </td>
      </tr>
      ${propertyBlock}
      <tr>
        <td style="padding:8px 32px 28px">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#3A2418">${signOff}<br/><strong>${teamLine}</strong></p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;background:#fff;border-top:1px solid #EDE6D9;font-size:12px;color:#5C3A26">
          <a href="https://alabproperty.com" style="color:#A8882F;text-decoration:none">alabproperty.com</a>
          &nbsp;·&nbsp;
          <a href="mailto:property@alabproperty.com" style="color:#A8882F;text-decoration:none">property@alabproperty.com</a>
          &nbsp;·&nbsp;
          ${websiteLabel}
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = locale === 'en'
    ? `Hello ${name},

Thank you for reaching out to ALAB Property. We've received your inquiry${propertyTitle ? ` about "${propertyTitle}"` : ''} and would like to walk you through the details personally.

One of our consultants will be in touch within 12 hours. Reply to this email with a convenient time for a call, or any additional questions.

${propertyLink ? `View property: ${propertyLink}\n\n` : ''}Warm regards,
ALAB Property Team
property@alabproperty.com
https://alabproperty.com`
    : `Здравствуйте, ${name}!

Благодарим за обращение в ALAB Property. Мы получили ваш запрос${propertyTitle ? ` по объекту «${propertyTitle}»` : ''} и хотели бы предметно обсудить детали.

Наш консультант свяжется с вами в течение 12 часов. Ответьте на это письмо с удобным временем для звонка или с дополнительными вопросами.

${propertyLink ? `Объект: ${propertyLink}\n\n` : ''}С уважением,
Команда ALAB Property
property@alabproperty.com
https://alabproperty.com`

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
