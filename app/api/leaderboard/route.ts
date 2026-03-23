import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const timeWindow = searchParams.get('window') ?? '1d'
  const category = searchParams.get('category') ?? 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

  const supabase = await createClient()

  // ── Determine sort column and period fields ──────────────────────────────────
  const pnlCol = timeWindow === 'all' ? 'total_pnl' : `pnl_${timeWindow}`
  const volCol = timeWindow === 'all' ? 'total_volume' : `volume_${timeWindow}`

  let query = supabase
    .from('traders')
    .select('*')
    .not('rank_all', 'is', null)
    .order(pnlCol, { ascending: false })
    .limit(limit)

  const { data: traders, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let result = traders ?? []

  // ── Category filter: only include traders who have traded in this category ──
  if (category !== 'all' && result.length > 0) {
    const { data: catTraders } = await supabase
      .from('trades')
      .select('trader_id')
      .eq('category', category)
      .in('trader_id', result.map(t => t.id))
    const catIds = new Set((catTraders ?? []).map((t: { trader_id: string }) => t.trader_id))
    result = result.filter(t => catIds.has(t.id))
  }

  // ── Fetch markets_traded count for each trader ───────────────────────────────
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
        markets_traded: countMap.get(t.id)?.size ?? 0,
      }))
    }
  }

  // ── Assign clean sequential ranks and period-specific fields ─────────────────
  result = result.map((t, i) => ({
    ...t,
    period_rank: i + 1,
    period_pnl: t[pnlCol] ?? 0,
    period_volume: t[volCol] ?? 0,
  }))

  return NextResponse.json({ traders: result, window: timeWindow })
}
