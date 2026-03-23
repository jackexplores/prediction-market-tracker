import { createClient } from '@/lib/supabase/server'
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

export const revalidate = 300

async function getInitialTraders() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('traders')
      .select('*')
      .not('rank_all', 'is', null)
      .order('rank_all', { ascending: true })
      .limit(100)
    return data ?? []
  } catch {
    return []
  }
}

export default async function LeaderboardPage() {
  const traders = await getInitialTraders()

  return (
    <div>
      {/* Hero */}
      <div className="border-b border-[#E8E8E8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0D0D0D] tracking-tight mb-2">
            Leaderboard
          </h1>
          <p className="text-[15px] text-[#8C8C8C] max-w-xl">
            The highest-performing Polymarket traders, ranked by realised profit.
            Click any row to see their full trade history.
          </p>

          {/* Stats row */}
          {traders.length > 0 && (
            <div className="flex items-center gap-8 mt-6">
              <StatChip label="Traders tracked" value={`${traders.length}+`} />
              <StatChip
                label="Top PnL (all time)"
                value={`$${Math.max(...traders.map(t => t.total_pnl)).toLocaleString('en-US', { notation: 'compact' })}`}
                positive
              />
              <StatChip label="Data source" value="Polymarket" />
            </div>
          )}
        </div>
      </div>

      <LeaderboardClient initialTraders={traders} />
    </div>
  )
}

function StatChip({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className={`text-[20px] font-bold ${positive ? 'text-[#00C805]' : 'text-[#0D0D0D]'}`}>
        {value}
      </div>
      <div className="text-[12px] text-[#8C8C8C] font-medium mt-0.5">{label}</div>
    </div>
  )
}
