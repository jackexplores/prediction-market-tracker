import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getWalletActivity } from '@/lib/polymarket/client'
import { detectCategory } from '@/lib/polymarket/client'

export const runtime = 'nodejs'
export const maxDuration = 300

function authCheck(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-vercel-cron')
  const secret = process.env.CRON_SECRET
  if (cronHeader === '1') return true
  if (secret && auth === `Bearer ${secret}`) return true
  return false
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const tier = url.searchParams.get('tier') ?? 'top' // 'top' = top 50, 'extended' = rest
  const supabase = createServiceClient()

  // Fetch traders ordered by rank
  const query = supabase
    .from('traders')
    .select('id, wallet_address, last_synced_at, rank_all')
    .order('rank_all', { ascending: true, nullsFirst: false })

  if (tier === 'top') {
    query.limit(50)
  } else {
    query.range(50, 300)
  }

  const { data: traders, error } = await query
  if (error || !traders) {
    return NextResponse.json({ error: 'Failed to fetch traders' }, { status: 500 })
  }

  let tradesSynced = 0
  const errors: string[] = []

  for (let i = 0; i < traders.length; i++) {
    const trader = traders[i]

    // Jitter to respect rate limits (~100 req/min)
    if (i > 0 && i % 10 === 0) await sleep(6000 + Math.random() * 1000)

    try {
      const since = trader.last_synced_at
      const activities = await getWalletActivity(trader.wallet_address, since, 50)

      const tradesToInsert = activities
        .filter((a: Record<string, unknown>) => a.type === 'TRADE' || !a.type)
        .map((a: Record<string, unknown>) => ({
          trader_id: trader.id,
          market_slug: a.slug ?? a.conditionId ?? '',
          market_title: a.title ?? a.market ?? null,
          category: detectCategory([], String(a.title ?? '')),
          side: a.side === 'BUY' || a.side === 'buy' ? 'BUY' : 'SELL',
          outcome: a.outcome ?? null,
          price: a.price ? parseFloat(String(a.price)) : null,
          usdc_size: a.usdcSize ? parseFloat(String(a.usdcSize)) : null,
          timestamp: a.timestamp ?? new Date().toISOString(),
          tx_hash: a.transactionHash ?? a.txHash ?? null,
        }))

      if (tradesToInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('trades')
          .upsert(tradesToInsert, { onConflict: 'tx_hash', ignoreDuplicates: true })
        if (insertErr) {
          // tx_hash may be null for some trades — insert without conflict check
          const withoutTxHash = tradesToInsert
            .filter((t: Record<string, unknown>) => !t.tx_hash)
            .map(({ tx_hash: _, ...rest }: { tx_hash: unknown; [key: string]: unknown }) => rest)
          if (withoutTxHash.length > 0) {
            await supabase.from('trades').insert(withoutTxHash)
          }
        }
        tradesSynced += tradesToInsert.length
      }

      // Update last_synced_at
      await supabase
        .from('traders')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', trader.id)
    } catch (err) {
      errors.push(`${trader.wallet_address}: ${err}`)
    }
  }

  return NextResponse.json({
    success: true,
    tier,
    traders_polled: traders.length,
    trades_synced: tradesSynced,
    errors: errors.slice(0, 5),
    timestamp: new Date().toISOString(),
  })
}
