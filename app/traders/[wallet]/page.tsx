import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TraderProfileClient } from '@/components/profile/TraderProfileClient'

interface Props {
  params: Promise<{ wallet: string }>
}

async function getTraderData(wallet: string) {
  const supabase = await createClient()

  const { data: trader } = await supabase
    .from('traders')
    .select('*')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (!trader) return null

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('trader_id', trader.id)
    .order('timestamp', { ascending: false })
    .limit(100)

  // Category breakdown
  const catBreakdown: Record<string, { volume: number; count: number }> = {}
  for (const trade of trades ?? []) {
    const cat = trade.category ?? 'Other'
    if (!catBreakdown[cat]) catBreakdown[cat] = { volume: 0, count: 0 }
    catBreakdown[cat].volume += trade.usdc_size ?? 0
    catBreakdown[cat].count += 1
  }

  return { trader, trades: trades ?? [], category_breakdown: catBreakdown }
}

export default async function TraderProfilePage({ params }: Props) {
  const { wallet } = await params
  const data = await getTraderData(wallet)

  if (!data) notFound()

  return <TraderProfileClient data={data} />
}

export async function generateMetadata({ params }: Props) {
  const { wallet } = await params
  const supabase = await createClient()
  const { data: trader } = await supabase
    .from('traders')
    .select('username, total_pnl')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  const name = trader?.username ?? wallet.slice(0, 8) + '...'
  return {
    title: `${name} — Polytracker`,
    description: `Polymarket trader ${name}. Track their trades, PnL, and market positions.`,
  }
}
