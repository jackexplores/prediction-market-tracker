import { MarketsClient } from '@/components/markets/MarketsClient'
import { createClient } from '@/lib/supabase/server'
import { titleMatchScore } from '@/lib/kalshi/client'

export const revalidate = 900

async function getDualListedMarkets() {
  try {
    const supabase = await createClient()

    const [{ data: polymarkets }, { data: kalshiMarkets }, { data: kalshiStats }] =
      await Promise.all([
        supabase
          .from('markets')
          .select('*')
          .eq('platform', 'polymarket')
          .eq('status', 'active')
          .order('volume', { ascending: false })
          .limit(200),
        supabase
          .from('markets')
          .select('*')
          .eq('platform', 'kalshi')
          .eq('status', 'active')
          .order('volume', { ascending: false })
          .limit(200),
        supabase
          .from('kalshi_trade_stats')
          .select('*')
          .order('last_updated', { ascending: false })
          .limit(200),
      ])

    const kalshiStatsByTicker = new Map(
      (kalshiStats ?? []).map(s => [s.ticker, s])
    )

    const crossPlatform = (polymarkets ?? []).map(pm => {
      let bestMatch: typeof kalshiMarkets extends (infer T)[] | null ? T : never | null = null
      let bestScore = 0
      for (const km of kalshiMarkets ?? []) {
        const score = titleMatchScore(pm.title, km.title)
        if (score > bestScore && score > 0.35) {
          bestScore = score
          bestMatch = km
        }
      }
      const kStats = bestMatch ? kalshiStatsByTicker.get(bestMatch.slug_or_ticker) ?? null : null
      const pmYes = pm.current_prices?.yes ?? pm.current_prices?.YES ?? null
      const kalshiYes = kStats?.last_yes_price ?? bestMatch?.current_prices?.yes ?? null
      const priceDiffPct = pmYes && kalshiYes
        ? Math.abs((pmYes - kalshiYes) / ((pmYes + kalshiYes) / 2)) * 100
        : null

      return { polymarket: pm, kalshi: bestMatch, kalshi_stats: kStats, price_diff_pct: priceDiffPct }
    }).filter(m => m.kalshi !== null)
      .sort((a, b) => (b.price_diff_pct ?? 0) - (a.price_diff_pct ?? 0))

    return crossPlatform
  } catch {
    return []
  }
}

export default async function MarketsPage() {
  const markets = await getDualListedMarkets()

  return (
    <div>
      <div className="border-b border-[#E8E8E8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0D0D0D] tracking-tight mb-2">
            Cross-Platform Markets
          </h1>
          <p className="text-[15px] text-[#8C8C8C] max-w-xl">
            Markets available on both Polymarket and Kalshi. Price divergence &gt;5% may signal an opportunity.
          </p>
          {markets.length > 0 && (
            <div className="flex items-center gap-8 mt-6">
              <div>
                <div className="text-[20px] font-bold text-[#0D0D0D]">{markets.length}</div>
                <div className="text-[12px] text-[#8C8C8C] font-medium mt-0.5">Dual-listed markets</div>
              </div>
              <div>
                <div className="text-[20px] font-bold text-[#FF5000]">
                  {markets.filter(m => (m.price_diff_pct ?? 0) > 5).length}
                </div>
                <div className="text-[12px] text-[#8C8C8C] font-medium mt-0.5">Price divergence &gt;5%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <MarketsClient markets={markets} />
    </div>
  )
}
