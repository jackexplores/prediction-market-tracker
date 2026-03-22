import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'all'
  const traderIds = searchParams.getAll('trader_id')
  const minSize = parseFloat(searchParams.get('min_size') ?? '0')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = await createClient()

  let query = supabase
    .from('trades')
    .select(`
      *,
      traders!inner(username, wallet_address, profile_image, rank_all, verified)
    `)
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category !== 'all') {
    query = query.eq('category', category)
  }

  if (traderIds.length > 0) {
    query = query.in('trader_id', traderIds)
  }

  if (minSize > 0) {
    query = query.gte('usdc_size', minSize)
  }

  const { data: trades, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trades: trades ?? [] })
}
