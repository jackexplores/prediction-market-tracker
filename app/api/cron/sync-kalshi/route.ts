import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getKalshiMarkets, getKalshiTrades } from '@/lib/kalshi/client'

export const runtime = 'nodejs'
export const maxDuration = 60

function authCheck(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-vercel-cron')
  const secret = process.env.CRON_SECRET
  if (cronHeader === '1') return true
  if (secret && auth === `Bearer ${secret}`) return true
  return false
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { markets } = await getKalshiMarkets(200)

  let synced = 0

  for (const market of markets.slice(0, 100)) {
    try {
      const ticker = market.ticker
      const trades = await getKalshiTrades(ticker, 50)

      const totalVolume = trades.reduce(
        (sum: number, t: Record<string, unknown>) => sum + (Number(t.count ?? t.volume ?? 0)),
        0
      )
      const lastTrade = trades[0]

      // Upsert market
      await supabase.from('markets').upsert(
        {
          platform: 'kalshi',
          slug_or_ticker: ticker,
          title: market.title ?? market.subtitle ?? ticker,
          category: market.category ?? null,
          current_prices: {
            yes: market.yes_bid ?? market.last_price ?? null,
            no: market.no_bid ?? null,
          },
          volume: market.volume ?? 0,
          status: market.status === 'open' ? 'active' : market.status ?? 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'platform,slug_or_ticker' }
      )

      // Upsert kalshi stats
      await supabase.from('kalshi_trade_stats').upsert(
        {
          ticker,
          total_volume: totalVolume,
          trade_count: trades.length,
          last_yes_price: lastTrade?.yes_price_dollars ?? lastTrade?.yes_price ?? null,
          last_no_price: lastTrade?.no_price_dollars ?? lastTrade?.no_price ?? null,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'ticker' }
      )

      synced++
    } catch (err) {
      console.error(`Kalshi sync failed for ${market.ticker}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    markets_synced: synced,
    timestamp: new Date().toISOString(),
  })
}
