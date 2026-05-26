import { NextResponse } from 'next/server'
import { FALLBACK_RATES } from '@/lib/currency'
import type { Currency } from '@/lib/types'

// open.er-api.com is free, key-less, ~1-2 update lag per day. We treat THB as
// the base and convert into our 5 currencies. For USDT we just use the USD
// rate — USDT is dollar-pegged so the difference is below display noise.
const SOURCE = 'https://open.er-api.com/v6/latest/THB'

// 1 hour: rates barely move within a trading day; we'd rather hit cache than
// re-fetch per request. ISR + Next's fetch cache handle this automatically.
// Next requires this to be a literal — keep the number in two places sync'd.
export const revalidate = 3600
const REVALIDATE_SECONDS = 3600

interface ErApiResponse {
  result: 'success' | 'error'
  rates?: Record<string, number>
  time_last_update_unix?: number
}

export async function GET() {
  try {
    const res = await fetch(SOURCE, {
      // Next caches this server-side; client fetches our route, not the upstream.
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) throw new Error(`upstream ${res.status}`)
    const data = (await res.json()) as ErApiResponse
    if (data.result !== 'success' || !data.rates) throw new Error('upstream-bad-shape')

    const rates: Record<Currency, number> = {
      THB: 1,
      USD: numberOrFallback(data.rates.USD, FALLBACK_RATES.USD),
      EUR: numberOrFallback(data.rates.EUR, FALLBACK_RATES.EUR),
      RUB: numberOrFallback(data.rates.RUB, FALLBACK_RATES.RUB),
      // USDT pegged to USD — using the same rate avoids needing a second API call.
      USDT: numberOrFallback(data.rates.USD, FALLBACK_RATES.USDT),
    }

    return NextResponse.json(
      {
        ok: true,
        rates,
        updatedAt: data.time_last_update_unix
          ? new Date(data.time_last_update_unix * 1000).toISOString()
          : new Date().toISOString(),
      },
      {
        // Browser cache hint — let CDNs and browsers reuse the response too.
        headers: {
          'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 24}`,
        },
      },
    )
  } catch (err) {
    // Graceful degradation: caller gets fallback rates rather than 500.
    // Frontend has the same numbers baked in, so the UI is consistent.
    return NextResponse.json(
      {
        ok: false,
        rates: FALLBACK_RATES,
        updatedAt: null,
        error: err instanceof Error ? err.message : 'fetch-failed',
      },
      { status: 200 },
    )
  }
}

function numberOrFallback(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback
}
