import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const timeWindow = searchParams.get('window') ?? '1d'
  const category = searchParams.get('category') ?? 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

  const supabase = await createClient()

  // ── Determine sort column ───────────────────────────────────────────────────
  const isPeriod = timeWindow !== 'all'
  const pnlCol = isPeriod ? `pnl_${timeWindow}` : 'total_pnl'
  const volCol = isPeriod ? `volume_${timeWindow}` : 'total_volume'

  let query = supabase
    .from('traders')
    .select('*')
    .order(pnlCol, { ascending: false, nullsFirst: false })
    .limit(limit)

  // All-time: only show ranked traders
  if (!isPeriod) {
    query = query.not('rank_all', 'is', null)
  } else {
    // Period: only traders with data for this window
    query = query.gt(pnlCol, 0)
  }

  const { data: traders, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let result = traders ?? []

  // ── Category filter ─────────────────────────────────────────────────────────
  if (category !== 'all' && result.length > 0) {
    const { data: catTraders } = await supabase
      .from('trades')
      .select('trader_id')
      .eq('category', category)
      .in('trader_id', result.map(t => t.id))
    const catIds = new Set((catTraders ?? []).map((t: { trader_id: string }) => t.trader_id))
    result = result.filter(t => catIds.has(t.id))
  }

  // ── Fetch markets_traded count ──────────────────────────────────────────────
  if (result.length > 0) {
    const traderIds = result.map(t => t.id)
    const { data: marketCounts } = await supabase
      .from('trades')
      .select('trader_id, market_slug')
      .in('trader_id', traderIds)

    if (marketCounts) {
      const countMap = new Map<string, Set<string>>()
      for (const row of marketCounts) {
        if (!countMap.has(row.trader_id)) countMap.set(row.trader_id, new Set())
        countMap.get(row.trader_id)!.add(row.market_slug)
      }
      result = result.map(t => ({
        ...t,
        markets_traded: countMap.get(t.id)?.size ?? (t.markets_traded ?? 0),
      }))
    }
  }

  // ── Assign ranks and period-specific fields ─────────────────────────────────
  result = result.map((t, i) => ({
    ...t,
    period_rank: i + 1,
    period_pnl: (t as Record<string, unknown>)[pnlCol] ?? t.total_pnl ?? 0,
    period_volume: (t as Record<string, unknown>)[volCol] ?? t.total_volume ?? 0,
  }))

  return NextResponse.json({ traders: result, window: timeWindow })
}
