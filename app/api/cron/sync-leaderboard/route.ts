import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/lib/polymarket/client'
import { TimeWindow } from '@/lib/types'

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
  const windows: TimeWindow[] = ['1d', '7d', '30d', 'all']
  const allTraders = new Map<string, Record<string, unknown>>()

  for (const win of windows) {
    try {
      const entries = await getLeaderboard(win, 50)
      for (const entry of entries) {
        const wallet = entry.proxyWallet?.toLowerCase()
        if (!wallet) continue
        const existing = allTraders.get(wallet) ?? {}
        allTraders.set(wallet, {
          ...existing,
          wallet_address: wallet,
          username: entry.userName || existing.username || null,
          profile_image: entry.profileImage || existing.profile_image || null,
          x_username: entry.xUsername || existing.x_username || null,
          verified: entry.verifiedBadge || existing.verified || false,
          [`rank_${win}`]: entry.rank,
          ...(win === 'all' ? {
            total_pnl: entry.pnl,
            total_volume: entry.vol,
          } : {
            [`pnl_${win}`]: entry.pnl,
            [`volume_${win}`]: entry.vol,
          }),
          last_synced_at: new Date().toISOString(),
        })
      }

      // Save snapshot
      await supabase.from('leaderboard_snapshots').insert({
        time_window: win,
        snapshot_data: entries,
        captured_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`Leaderboard sync failed for ${win}:`, err)
    }
  }

  // Upsert all traders
  const traders = Array.from(allTraders.values())
  if (traders.length > 0) {
    const { error } = await supabase
      .from('traders')
      .upsert(traders, { onConflict: 'wallet_address' })
    if (error) console.error('Trader upsert error:', error)
  }

  return NextResponse.json({
    success: true,
    traders_synced: traders.length,
    timestamp: new Date().toISOString(),
  })
}
