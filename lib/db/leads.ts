import { supabaseAdmin } from '../supabase'

export interface LeadInsert {
  name: string
  email: string
  phone?: string
  preferred_contact: 'email' | 'phone' | 'whatsapp'
  message?: string
  crypto_payment: boolean
  property_id?: string | null
  property_title?: string | null
  property_slug?: string | null
}

export async function insertLead(
  lead: LeadInsert,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from('leads').insert({
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? null,
    preferred_contact: lead.preferred_contact,
    message: lead.message ?? null,
    crypto_payment: lead.crypto_payment,
    property_id: lead.property_id ?? null,
    property_title: lead.property_title ?? null,
    property_slug: lead.property_slug ?? null,
  })

  if (error) {
    console.error('[db/leads] insertLead error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
