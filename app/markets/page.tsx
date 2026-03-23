import { MarketsClient } from '@/components/markets/MarketsClient'
import { createClient } from '@/lib/supabase/server'
import { Market } from '@/lib/types'

export const revalidate = 900

async function getMarkets(): Promise<Market[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('markets')
      .select('*')
      .eq('platform', 'polymarket')
      .eq('status', 'active')
      .order('volume', { ascending: false })
      .limit(300)
    return (data ?? []) as Market[]
  } catch {
    return []
  }
}

export default async function MarketsPage() {
  const markets = await getMarkets()

  const totalVolume = markets.reduce((s, m) => s + (m.volume ?? 0), 0)

  return (
    <div>
      <div className="border-b border-[#E8E8E8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0D0D0D] tracking-tight mb-2">
            Markets
          </h1>
          <p className="text-[15px] text-[#8C8C8C] max-w-xl">
            Active Polymarket prediction markets, sorted by volume.
          </p>
          {markets.length > 0 && (
            <div className="flex items-center gap-8 mt-6">
              <StatChip label="Active markets" value={String(markets.length)} />
              <StatChip
                label="Total volume"
                value={`$${(totalVolume / 1_000_000).toFixed(1)}M`}
              />
              <StatChip label="Data source" value="Polymarket" />
            </div>
          )}
        </div>
      </div>

      <MarketsClient markets={markets} />
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
