import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env.LEAD_DRAFT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!secret) throw new Error('LEAD_DRAFT_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback) missing')
  return secret
}

export function signLeadId(leadId: string): string {
  return crypto.createHmac('sha256', getSecret()).update(leadId).digest('hex').slice(0, 32)
}

export function verifyLeadToken(leadId: string, token: string): boolean {
  try {
    const expected = signLeadId(leadId)
    if (expected.length !== token.length) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}
