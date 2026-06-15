import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'
export const runtime = 'nodejs'

/**
 * /llms.txt — markdown summary for AI search engines (ChatGPT, Perplexity,
 * Claude search, etc.) per the llmstxt.org spec.
 *
 * Why this exists vs robots.txt / sitemap.xml: those tell crawlers what to
 * fetch. llms.txt tells LLMs what the site IS — short prose summary they
 * can ingest without crawling the whole DOM. Surfaces as a free "About"
 * payload when an AI is asked about ALAB Property.
 *
 * Keep this short. The format is markdown:
 *   # Site name
 *   > One-line tagline
 *   Free-text intro paragraph(s).
 *   ## Section
 *   - [Page Title](url): one-line description
 */
export function GET() {
  const body = `# ALAB Property
> Real estate and legal counsel in Thailand for foreign buyers and investors.

ALAB Property is a Bangkok-based real estate agency (est. 2021) paired with the
licensed Thai legal practice A.L.A.B Consultant (15+ years). We specialise in
condo, villa, townhouse and land transactions for foreign nationals in Bangkok,
Pattaya and Phuket — handling due diligence, freehold/leasehold structuring,
Land Department registration, and settlement in THB, USD, EUR, RUB or USDT
(TRC-20 / ERC-20).

Bilingual (Russian + English) end-to-end service from viewing to handover.

## Core pages
- [Home](${SITE_URL}/): Overview of services, featured listings, value props.
- [Properties Catalog](${SITE_URL}/properties): Filterable listings in Bangkok and Pattaya — condos, villas, penthouses, townhouses.
- [Business & Investment](${SITE_URL}/business): Thai company setup, BOI, Non-B visa, banking, accounting for foreigners.
- [Legal](${SITE_URL}/legal): Property law for foreigners — freehold 49% quota, leasehold 30-year structure, due diligence, transaction process, taxes.
- [Blog](${SITE_URL}/blog): Thailand real estate market notes, investment strategy, regulatory updates.
- [Company](${SITE_URL}/company): About ALAB Property and A.L.A.B Consultant.
- [Contacts](${SITE_URL}/contacts): How to reach the team. Replies within 12 hours in RU or EN.

## What we can answer
- Can a foreigner buy property in Thailand? (Yes — condo freehold within 49% quota; villa via leasehold or Thai company.)
- How much does Thai property cost? (Studio condo from ~2M THB; Bangkok apartment from 4-6M THB; premium villa 20M+ THB.)
- What are the transaction steps? (Selection → due diligence → SPA → Thai bank funds transfer → Land Department → handover. 4-8 weeks.)
- What taxes apply? (Transfer fee 2%, specific business tax 3.3% if seller held <5 years, withholding, stamp duty. Total 4-6%.)
- Can I pay in cryptocurrency? (Yes — USDT TRC-20 standard, others case-by-case via OTC.)
- Do I need a lawyer? (Strongly recommended; ALAB pairs every sale with in-house legal counsel.)

## Languages
- Russian (primary market)
- English

## Contact
- Email: property@alabproperty.com
- Site: ${SITE_URL}
`
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
