import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { titleMatchScore } from '@/lib/kalshi/client'

export const revalidate = 900 // 15 min

export async function GET(_req: NextRequest) {
  const supabase = await createClient()

  const [{ data: polymarkets }, { data: kalshiMarkets }, { data: kalshiStats }] =
    await Promise.all([
      supabase
        .from('markets')
        .select('*')
        .eq('platform', 'polymarket')
        .eq('status', 'active')
        .order('volume', { ascending: false })
        .limit(100),
      supabase
        .from('markets')
        .select('*')
        .eq('platform', 'kalshi')
        .eq('status', 'active')
        .order('volume', { ascending: false })
        .limit(100),
      supabase
        .from('kalshi_trade_stats')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(100),
    ])

  const kalshiStatsByTicker = new Map(
    (kalshiStats ?? []).map(s => [s.ticker, s])
  )

  // Fuzzy match polymarket <-> kalshi
  const crossPlatform = (polymarkets ?? []).map(pm => {
    let bestMatch = null
    let bestScore = 0

    for (const km of kalshiMarkets ?? []) {
      const score = titleMatchScore(pm.title, km.title)
      if (score > bestScore && score > 0.4) {
        bestScore = score
        bestMatch = km
      }
    }

    const kalshiStats = bestMatch ? kalshiStatsByTicker.get(bestMatch.slug_or_ticker) ?? null : null
    const pmYes = pm.current_prices?.yes ?? pm.current_prices?.YES ?? null
    const kalshiYes = kalshiStats?.last_yes_price ?? bestMatch?.current_prices?.yes ?? null

    const priceDiffPct = pmYes && kalshiYes
      ? Math.abs((pmYes - kalshiYes) / ((pmYes + kalshiYes) / 2)) * 100
      : null

    return {
      polymarket: pm,
      kalshi: bestMatch,
      kalshi_stats: kalshiStats,
      price_diff_pct: priceDiffPct,
      match_score: bestScore,
    }
  })

  // Only return markets with a kalshi match
  const dualListed = crossPlatform
    .filter(m => m.kalshi !== null)
    .sort((a, b) => (b.price_diff_pct ?? 0) - (a.price_diff_pct ?? 0))

  return NextResponse.json({ markets: dualListed })
}
