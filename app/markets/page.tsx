import { MarketsClient } from '@/components/markets/MarketsClient'
import { getMarkets, detectCategory } from '@/lib/polymarket/client'

export const revalidate = 300

interface PolymarketRow {
  id: string
  title: string
  slug: string
  category: string
  yesPrice: number | null
  volume: number
}

async function getPolymarkets(): Promise<PolymarketRow[]> {
  try {
    const raw = await getMarkets(200)
    return (raw as Record<string, unknown>[])
      .filter(m => m.active && !m.archived && !m.closed)
      .map(m => {
        const tagLabels = ((m.tags ?? []) as unknown[]).map(t =>
          typeof t === 'string' ? t : ((t as Record<string, string>)?.label ?? (t as Record<string, string>)?.slug ?? '')
        ).filter(Boolean)

        let pricesArr: string[] = []
        if (typeof m.outcomePrices === 'string') {
          try { pricesArr = JSON.parse(m.outcomePrices) } catch { pricesArr = [] }
        } else if (Array.isArray(m.outcomePrices)) {
          pricesArr = m.outcomePrices as string[]
        }

        const yesPrice = pricesArr[0] ? parseFloat(pricesArr[0]) : null
        const vol = m.volumeNum ? Number(m.volumeNum) : (m.volume ? parseFloat(String(m.volume)) : 0)

        return {
          id: String(m.id ?? m.conditionId ?? ''),
          title: String(m.question ?? m.title ?? ''),
          slug: String(m.slug ?? ''),
          category: detectCategory(tagLabels, String(m.question ?? ''), String(m.slug ?? '')),
          yesPrice: yesPrice != null && !isNaN(yesPrice) ? yesPrice : null,
          volume: isNaN(vol) ? 0 : vol,
        }
      })
      .filter(m => m.title && m.id)
      .sort((a, b) => b.volume - a.volume)
  } catch (e) {
    console.error('Failed to fetch Polymarket markets:', e)
    return []
  }
}

export default async function MarketsPage() {
  const markets = await getPolymarkets()
  const totalVol = markets.reduce((s, m) => s + m.volume, 0)

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
                value={`$${(totalVol / 1_000_000).toFixed(1)}M`}
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

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[20px] font-bold text-[#0D0D0D]">{value}</div>
      <div className="text-[12px] text-[#8C8C8C] font-medium mt-0.5">{label}</div>
    </div>
  )
}
