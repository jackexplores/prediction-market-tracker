import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const WINDOW_MS: Record<string, number> = {
  '1d': 86_400_000,
  '7d': 604_800_000,
  '30d': 2_592_000_000,
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const timeWindow = searchParams.get('window') ?? '1d'
  const category = searchParams.get('category') ?? 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

  const supabase = await createClient()

  // ── All-time: sort by total_pnl to bypass corrupt rank_all ──────────────────
  if (timeWindow === 'all') {
    let query = supabase
      .from('traders')
      .select('*')
      .not('rank_all', 'is', null)
      .order('total_pnl', { ascending: false })
      .limit(limit)

    const { data: traders, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let result = traders ?? []

    if (category !== 'all' && result.length > 0) {
      const { data: catTraders } = await supabase
        .from('trades')
        .select('trader_id')
        .eq('category', category)
        .in('trader_id', result.map(t => t.id))
      const catIds = new Set((catTraders ?? []).map((t: { trader_id: string }) => t.trader_id))
      result = result.filter(t => catIds.has(t.id))
    }

    // Assign clean sequential ranks
    result = result.map((t, i) => ({ ...t, period_rank: i + 1 }))
    return NextResponse.json({ traders: result, window: timeWindow })
  }

  // ── Period windows: rank by actual trade volume in the window ────────────────
  const cutoff = new Date(Date.now() - WINDOW_MS[timeWindow]).toISOString()

  let tradeQuery = supabase
    .from('trades')
    .select('trader_id, usdc_size')
    .gte('timestamp', cutoff)
    .limit(100000)

  if (category !== 'all') {
    tradeQuery = tradeQuery.eq('category', category)
  }

  const { data: periodTrades } = await tradeQuery

  if (!periodTrades || periodTrades.length === 0) {
    return NextResponse.json({ traders: [], window: timeWindow })
  }

  // Aggregate volume per trader
  const volMap = new Map<string, number>()
  for (const t of periodTrades) {
    volMap.set(t.trader_id, (volMap.get(t.trader_id) ?? 0) + Number(t.usdc_size ?? 0))
  }

  const sortedIds = [...volMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  if (sortedIds.length === 0) {
    return NextResponse.json({ traders: [], window: timeWindow })
  }

  const { data: traderDetails } = await supabase
    .from('traders')
    .select('*')
    .in('id', sortedIds)

  const traderMap = new Map((traderDetails ?? []).map(t => [t.id, t]))

  const result = sortedIds
    .map((id, index) => {
      const trader = traderMap.get(id)
      if (!trader) return null
      return {
        ...trader,
        period_volume: volMap.get(id) ?? 0,
        period_rank: index + 1,
      }
    })
    .filter(Boolean)

  return NextResponse.json({ traders: result, window: timeWindow })
}
