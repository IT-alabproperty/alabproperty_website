// Lead confirmation email template — bilingual (ru/en), table-based layout, inline styles only.
// Why tables + inline styles: Gmail/Outlook strip <style> blocks and ignore flex/grid.
// Why no external deps: keep the bundle tiny — one template doesn't justify React Email/mjml.

export interface LeadConfirmationInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  propertyTitle?: string | null;
  propertySlug?: string | null;
  cryptoPayment?: boolean;
  locale: 'ru' | 'en';
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// Brand tokens — kept in sync with app/globals.css
const COLORS = {
  teakDeep: '#2B1810',
  teak: '#3A2418',
  cream: '#F5EFE6',
  paper: '#FBF8F2',
  gold: '#C9A961',
  goldDeep: '#A8882F',
  muted: '#8C7A6B',
  border: '#E5DCC9',
  white: '#FFFFFF',
} as const;

// System font stacks only — webfonts are unreliable across mail clients
const FONT_SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const FONT_SANS = "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

interface Dict {
  subject: string;
  preheader: string;
  eyebrow: string;
  greeting: (name: string) => string;
  intro: string;
  responseTime: string;
  propertyMention: (title: string) => string;
  cryptoMention: string;
  recapHeading: string;
  recapName: string;
  recapEmail: string;
  recapPhone: string;
  recapMessage: string;
  recapProperty: string;
  signoff: string;
  team: string;
  footerDisclaimer: string;
  footerAddress: string;
  privacy: string;
  website: string;
  viewProperty: string;
}

const DICT: Record<'ru' | 'en', Dict> = {
  ru: {
    subject: 'Спасибо за обращение в ALAB Property',
    preheader: 'Юридический консультант ALAB свяжется с вами в течение 12 часов.',
    eyebrow: 'Bangkok · Thailand',
    greeting: (name) => `Здравствуйте, ${name}!`,
    intro: 'Благодарим вас за обращение в ALAB Property — мы получили вашу заявку.',
    responseTime: 'Юридический консультант ALAB свяжется с вами в течение 12 часов, чтобы обсудить детали и ответить на вопросы.',
    propertyMention: (title) => `Мы подготовим подробную информацию по объекту «${title}» и пришлём её вместе с ответом.`,
    cryptoMention: 'Вы отметили интерес к оплате в криптовалюте — мы подготовим прозрачные варианты сделки с использованием USDT (TRC-20) и сопроводим юридически каждый шаг.',
    recapHeading: 'Что было отправлено',
    recapName: 'Имя',
    recapEmail: 'Email',
    recapPhone: 'Телефон',
    recapMessage: 'Сообщение',
    recapProperty: 'Объект',
    signoff: 'С уважением,',
    team: 'Команда ALAB Property',
    footerDisclaimer: 'Вы получили это письмо, потому что отправили форму обратной связи на сайте alabproperty.com. Если это были не вы — просто проигнорируйте сообщение.',
    footerAddress: 'Bangkok, Thailand',
    privacy: 'Политика конфиденциальности',
    website: 'alabproperty.com',
    viewProperty: 'Открыть объект',
  },
  en: {
    subject: 'Thank you for contacting ALAB Property',
    preheader: 'An ALAB legal consultant will reach out within 12 hours.',
    eyebrow: 'Bangkok · Thailand',
    greeting: (name) => `Hello ${name}!`,
    intro: 'Thank you for reaching out to ALAB Property — we have received your enquiry.',
    responseTime: 'An ALAB legal consultant will contact you within 12 hours to discuss the details and answer your questions.',
    propertyMention: (title) => `We will prepare a detailed brief on “${title}” and send it together with our response.`,
    cryptoMention: 'You indicated interest in cryptocurrency payment — we will prepare transparent transaction options using USDT (TRC-20) with full legal accompaniment at every step.',
    recapHeading: 'What you sent us',
    recapName: 'Name',
    recapEmail: 'Email',
    recapPhone: 'Phone',
    recapMessage: 'Message',
    recapProperty: 'Property',
    signoff: 'Warm regards,',
    team: 'The ALAB Property Team',
    footerDisclaimer: "You're receiving this because you submitted a contact form at alabproperty.com. If this wasn't you, please ignore this message.",
    footerAddress: 'Bangkok, Thailand',
    privacy: 'Privacy Policy',
    website: 'alabproperty.com',
    viewProperty: 'View property',
  },
};

// HTML escape — prevent injection from user-supplied fields rendered into the template
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Recap row helper — emits a <tr> with label/value cells, stacking on narrow widths via inline styles
function recapRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;font-family:${FONT_SANS};">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:0 16px 4px 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};font-family:${FONT_SANS};white-space:nowrap;">
              ${escapeHtml(label)}
            </td>
            <td style="padding:0;font-size:15px;line-height:1.5;color:${COLORS.teakDeep};font-family:${FONT_SANS};">
              ${escapeHtml(value)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function renderLeadConfirmation(input: LeadConfirmationInput): RenderedEmail {
  const t = DICT[input.locale];
  const safeName = input.name.trim() || (input.locale === 'ru' ? 'гость' : 'guest');
  const subject = t.subject;

  const propertyParagraph = input.propertyTitle
    ? `<p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${COLORS.teak};">${escapeHtml(t.propertyMention(input.propertyTitle))}</p>`
    : '';

  const cryptoParagraph = input.cryptoPayment
    ? `<p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${COLORS.teak};">${escapeHtml(t.cryptoMention)}</p>`
    : '';

  const propertyUrl = input.propertySlug
    ? `https://alabproperty.com/${input.locale}/properties/${encodeURIComponent(input.propertySlug)}`
    : null;

  const propertyCta = propertyUrl
    ? `
      <tr>
        <td align="left" style="padding:8px 0 24px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="background-color:${COLORS.teakDeep};border-radius:2px;">
                <a href="${propertyUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.cream};text-decoration:none;">
                  ${escapeHtml(t.viewProperty)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : '';

  // Recap rows — only include fields the user actually provided
  const recapRows = [
    recapRow(t.recapName, safeName),
    recapRow(t.recapEmail, input.email),
    input.phone ? recapRow(t.recapPhone, input.phone) : '',
    input.propertyTitle ? recapRow(t.recapProperty, input.propertyTitle) : '',
    input.message ? recapRow(t.recapMessage, input.message) : '',
  ]
    .filter(Boolean)
    .join('');

  // Plain-text fallback — readable in clients that strip HTML
  const textLines: string[] = [
    `ALAB Property — ${t.eyebrow}`,
    '',
    t.greeting(safeName),
    '',
    t.intro,
    t.responseTime,
  ];
  if (input.propertyTitle) textLines.push(t.propertyMention(input.propertyTitle));
  if (input.cryptoPayment) textLines.push(t.cryptoMention);
  textLines.push('', `— ${t.recapHeading} —`);
  textLines.push(`${t.recapName}: ${safeName}`);
  textLines.push(`${t.recapEmail}: ${input.email}`);
  if (input.phone) textLines.push(`${t.recapPhone}: ${input.phone}`);
  if (input.propertyTitle) textLines.push(`${t.recapProperty}: ${input.propertyTitle}`);
  if (input.message) textLines.push(`${t.recapMessage}: ${input.message}`);
  if (propertyUrl) textLines.push('', `${t.viewProperty}: ${propertyUrl}`);
  textLines.push(
    '',
    t.signoff,
    t.team,
    '',
    `https://alabproperty.com`,
    `property@alabproperty.com`,
    t.footerAddress,
    '',
    t.footerDisclaimer,
  );
  const text = textLines.join('\n');

  // Preheader — hidden preview text shown by Gmail/Apple Mail in the inbox list
  const preheader = t.preheader;

  const html = `<!doctype html>
<html lang="${input.locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.paper};font-family:${FONT_SANS};">
    <!-- Preheader: hidden in body, visible in inbox preview -->
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COLORS.paper};opacity:0;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${COLORS.paper};border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <!-- Main container -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background-color:${COLORS.white};border-collapse:collapse;">

            <!-- Header -->
            <tr>
              <td style="padding:36px 40px 24px 40px;border-top:3px solid ${COLORS.gold};">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td align="left" style="font-family:${FONT_SERIF};font-size:28px;line-height:1;letter-spacing:4px;color:${COLORS.teakDeep};font-weight:500;">
                      ALAB
                    </td>
                    <td align="right" style="font-family:${FONT_SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted};">
                      ${escapeHtml(t.eyebrow)}
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:2px;font-family:${FONT_SERIF};font-size:13px;letter-spacing:6px;text-transform:uppercase;color:${COLORS.goldDeep};">
                      Property
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Gold separator -->
            <tr>
              <td style="padding:0 40px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="height:1px;line-height:1px;font-size:1px;background-color:${COLORS.border};">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Greeting + body -->
            <tr>
              <td style="padding:36px 40px 8px 40px;">
                <h1 style="margin:0 0 24px 0;font-family:${FONT_SERIF};font-weight:500;font-size:32px;line-height:1.2;color:${COLORS.teakDeep};">
                  ${escapeHtml(t.greeting(safeName))}
                </h1>
                <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${COLORS.teak};">
                  ${escapeHtml(t.intro)}
                </p>
                <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:16px;line-height:1.65;color:${COLORS.teak};">
                  ${escapeHtml(t.responseTime)}
                </p>
                ${propertyParagraph}
                ${cryptoParagraph}
              </td>
            </tr>

            <!-- Property CTA (only if propertySlug provided) -->
            ${propertyCta ? `<tr><td style="padding:0 40px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">${propertyCta}</table></td></tr>` : ''}

            <!-- Recap box -->
            <tr>
              <td style="padding:16px 40px 8px 40px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${COLORS.cream};border-collapse:collapse;">
                  <tr>
                    <td style="padding:24px 28px;">
                      <p style="margin:0 0 12px 0;font-family:${FONT_SERIF};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${COLORS.goldDeep};">
                        ${escapeHtml(t.recapHeading)}
                      </p>
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                        ${recapRows}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Signoff -->
            <tr>
              <td style="padding:32px 40px 40px 40px;">
                <p style="margin:0 0 4px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.5;color:${COLORS.teak};">
                  ${escapeHtml(t.signoff)}
                </p>
                <p style="margin:0;font-family:${FONT_SERIF};font-size:18px;line-height:1.4;color:${COLORS.teakDeep};">
                  ${escapeHtml(t.team)}
                </p>
              </td>
            </tr>

            <!-- Footer divider -->
            <tr>
              <td style="padding:0 40px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="height:1px;line-height:1px;font-size:1px;background-color:${COLORS.border};">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:28px 40px 36px 40px;background-color:${COLORS.white};">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 0 8px 0;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:${COLORS.teak};">
                      <a href="mailto:property@alabproperty.com" style="color:${COLORS.teakDeep};text-decoration:none;">property@alabproperty.com</a>
                      &nbsp;·&nbsp;
                      ${escapeHtml(t.footerAddress)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 16px 0;font-family:${FONT_SANS};font-size:13px;line-height:1.6;">
                      <a href="https://alabproperty.com" style="color:${COLORS.goldDeep};text-decoration:none;letter-spacing:1px;">${escapeHtml(t.website)}</a>
                      &nbsp;·&nbsp;
                      <a href="https://alabproperty.com/privacy" style="color:${COLORS.muted};text-decoration:underline;">${escapeHtml(t.privacy)}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:${FONT_SANS};font-size:11px;line-height:1.6;color:${COLORS.muted};">
                      ${escapeHtml(t.footerDisclaimer)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
          <!-- /Main container -->
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

/*
 * --- PREVIEW (RU, with propertyTitle + cryptoPayment) ---
 *
 * Example input:
 *   renderLeadConfirmation({
 *     name: 'Иван Петров',
 *     email: 'ivan@example.com',
 *     phone: '+7 999 123-45-67',
 *     message: 'Интересует двухкомнатная квартира с видом на реку.',
 *     propertyTitle: 'Riverside Penthouse at The Residences',
 *     propertySlug: 'riverside-penthouse-the-residences',
 *     cryptoPayment: true,
 *     locale: 'ru',
 *   })
 *
 * Produces:
 *   subject: "Спасибо за обращение в ALAB Property"
 *   text:    plain-text version with all sections
 *   html:    ~7-8 KB rendered template — see structure above. Sections in order:
 *            1. Preheader (hidden)
 *            2. Header (ALAB / Property logo, "Bangkok · Thailand" eyebrow, gold top border)
 *            3. Greeting "Здравствуйте, Иван Петров!"
 *            4. Intro + 12-hour response promise
 *            5. Property mention paragraph ("Мы подготовим подробную информацию по объекту «...»")
 *            6. Crypto mention paragraph (USDT TRC-20)
 *            7. "Открыть объект" CTA button (because propertySlug present)
 *            8. Cream recap box: Имя / Email / Телефон / Объект / Сообщение
 *            9. Signoff "С уважением, Команда ALAB Property"
 *           10. Footer: email, address, website link, privacy link, disclaimer
 */
