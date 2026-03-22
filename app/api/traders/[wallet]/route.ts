import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params
  const supabase = await createClient()

  const { data: trader, error } = await supabase
    .from('traders')
    .select('*')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (error || !trader) {
    return NextResponse.json({ error: 'Trader not found' }, { status: 404 })
  }

  // Trade history
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('trader_id', trader.id)
    .order('timestamp', { ascending: false })
    .limit(100)

  // Category breakdown
  let categoryStats = null
  try {
    const { data } = await supabase.rpc('get_trader_category_stats', { p_trader_id: trader.id })
    categoryStats = data
  } catch {
    // RPC not available, will compute from trades below
  }

  // Compute category breakdown from trades if RPC not available
  const catBreakdown: Record<string, { volume: number; count: number }> = {}
  for (const trade of trades ?? []) {
    const cat = trade.category ?? 'Other'
    if (!catBreakdown[cat]) catBreakdown[cat] = { volume: 0, count: 0 }
    catBreakdown[cat].volume += trade.usdc_size ?? 0
    catBreakdown[cat].count += 1
  }

  return NextResponse.json({
    trader,
    trades: trades ?? [],
    category_breakdown: categoryStats ?? catBreakdown,
  })
}
