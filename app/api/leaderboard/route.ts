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

  const rankCol = timeWindow === 'all' ? 'rank_all'
    : timeWindow === '30d' ? 'rank_30d'
    : timeWindow === '7d' ? 'rank_7d'
    : 'rank_1d'

  const { data: traders, error } = await supabase
    .from('traders')
    .select('*')
    .not(rankCol, 'is', null)
    .order(rankCol, { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let result = traders ?? []

  if (category !== 'all' && result.length > 0) {
    const { data: catTraders } = await supabase
      .from('trades')
      .select('trader_id')
      .eq('category', category)
      .in('trader_id', result.map(t => t.id))

    const catTraderIds = new Set((catTraders ?? []).map((t: { trader_id: string }) => t.trader_id))
    result = result.filter(t => catTraderIds.has(t.id))
  }

  // Compute period-specific volume from trades for non-all windows
  if (timeWindow !== 'all' && result.length > 0) {
    const cutoff = new Date(Date.now() - WINDOW_MS[timeWindow]).toISOString()
    const traderIds = result.map(t => t.id)

    const { data: periodTrades } = await supabase
      .from('trades')
      .select('trader_id, usdc_size')
      .in('trader_id', traderIds)
      .gte('timestamp', cutoff)
      .limit(50000)

    const volMap = new Map<string, number>()
    for (const t of periodTrades ?? []) {
      volMap.set(t.trader_id, (volMap.get(t.trader_id) ?? 0) + Number(t.usdc_size ?? 0))
    }

    result = result.map(t => ({
      ...t,
      period_volume: volMap.get(t.id) ?? 0,
    }))
  }

  return NextResponse.json({ traders: result, window: timeWindow })
}
