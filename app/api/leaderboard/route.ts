import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300 // 5 min cache

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const timeWindow = searchParams.get('window') ?? 'all'
  const category = searchParams.get('category') ?? 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

  const supabase = await createClient()

  const rankCol = timeWindow === 'all' ? 'rank_all'
    : timeWindow === '30d' ? 'rank_30d'
    : timeWindow === '7d' ? 'rank_7d'
    : 'rank_1d'

  let query = supabase
    .from('traders')
    .select('*')
    .not(rankCol, 'is', null)
    .order(rankCol, { ascending: true })
    .limit(limit)

  const { data: traders, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Attach win-rate-based category filtering from trades if needed
  let result = traders ?? []

  if (category !== 'all') {
    // Get traders who have trades in this category
    const { data: catTraders } = await supabase
      .from('trades')
      .select('trader_id')
      .eq('category', category)
      .in('trader_id', result.map(t => t.id))

    const catTraderIds = new Set((catTraders ?? []).map((t: { trader_id: string }) => t.trader_id))
    result = result.filter(t => catTraderIds.has(t.id))
  }

  return NextResponse.json({ traders: result, window: timeWindow })
}
