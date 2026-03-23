import { TradeFeedClient } from '@/components/feed/TradeFeedClient'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

async function getInitialTrades() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('trades')
      .select('*, traders!inner(username, wallet_address, profile_image, rank_all, verified)')
      .order('timestamp', { ascending: false })
      .limit(50)
    return data ?? []
  } catch {
    return []
  }
}

async function getTrackedTraders() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('traders')
      .select('id, username, wallet_address')
      .not('rank_all', 'is', null)
      .order('rank_all', { ascending: true })
      .limit(50)
    return data ?? []
  } catch {
    return []
  }
}

export default async function FeedPage() {
  const [trades, traders] = await Promise.all([getInitialTrades(), getTrackedTraders()])

  return (
    <div>
      {/* Header */}
      <div className="border-b border-[#E8E8E8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0D0D0D] tracking-tight">
              Trade Feed
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FFF0] border border-[#00C805]/20">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-[#00C805]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00C805]" />
              </span>
              <span className="text-[11px] font-semibold text-[#00C805]">LIVE</span>
            </div>
          </div>
          <p className="text-[15px] text-[#8C8C8C]">
            Real-time trades from tracked Polymarket wallets. Updates every 60 seconds.
          </p>
        </div>
      </div>

      <TradeFeedClient initialTrades={trades} trackedTraders={traders} />
    </div>
  )
}
