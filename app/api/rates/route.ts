// Future: fetch live exchange rates from an external API
// For now, rates are hardcoded in lib/currency.ts

export async function GET() {
  return Response.json({ message: 'Not implemented yet' }, { status: 501 });
}
