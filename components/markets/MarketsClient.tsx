'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MarketEntry {
  polymarket: {
    id: string
    title: string
    current_prices: Record<string, number> | null
    volume: number
    category: string | null
    slug_or_ticker: string
  }
  kalshi: {
    id: string
    title: string
    current_prices: Record<string, number> | null
    volume: number
    slug_or_ticker: string
  } | null
  kalshi_stats: {
    last_yes_price: number | null
    last_no_price: number | null
    total_volume: number
    trade_count: number
  } | null
  price_diff_pct: number | null
}

interface Props {
  markets: MarketEntry[]
}

export function MarketsClient({ markets }: Props) {
  const [filter, setFilter] = useState<'all' | 'diverged'>('all')

  const filtered = filter === 'diverged'
    ? markets.filter(m => (m.price_diff_pct ?? 0) > 5)
    : markets

  if (markets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-[16px] font-semibold text-[#0D0D0D] mb-2">No dual-listed markets yet</h3>
        <p className="text-[14px] text-[#8C8C8C] max-w-sm mx-auto">
          Market data syncs from Polymarket and Kalshi every 15 minutes. Check back shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter('all')} className={cn('pill', filter === 'all' && 'active')}>
          All ({markets.length})
        </button>
        <button onClick={() => setFilter('diverged')} className={cn('pill', filter === 'diverged' && 'active')}>
          Diverged &gt;5% ({markets.filter(m => (m.price_diff_pct ?? 0) > 5).length})
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(m => (
          <MarketRow key={m.polymarket.id} market={m} />
        ))}
      </div>

      <p className="mt-4 text-[12px] text-[#8C8C8C] text-center">
        Kalshi data for market context only · Not financial advice · Refreshes every 15 min
      </p>
    </div>
  )
}

function MarketRow({ market }: { market: MarketEntry }) {
  const { polymarket, kalshi, kalshi_stats, price_diff_pct } = market
  const isDiverged = (price_diff_pct ?? 0) > 5
  const isHighDivergence = (price_diff_pct ?? 0) > 10

  const pmYes = polymarket.current_prices?.yes ?? polymarket.current_prices?.YES ?? null
  const kalshiYes = kalshi_stats?.last_yes_price ?? kalshi?.current_prices?.yes ?? null

  const pmHigher = pmYes && kalshiYes ? pmYes > kalshiYes : null

  return (
    <div className={cn(
      'card px-5 py-4',
      isHighDivergence && 'ring-1 ring-[#FF5000]/20'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[14px] font-semibold text-[#0D0D0D] truncate">
              {polymarket.title}
            </h3>
            {isDiverged && (
              <span className={cn(
                'shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full',
                isHighDivergence
                  ? 'bg-[#FF5000]/10 text-[#FF5000]'
                  : 'bg-amber-50 text-amber-600'
              )}>
                {isHighDivergence ? '⚡' : '△'} {price_diff_pct?.toFixed(1)}% SPREAD
              </span>
            )}
          </div>
          {polymarket.category && (
            <span className="text-[11px] text-[#8C8C8C]">{polymarket.category}</span>
          )}
        </div>
      </div>

      {/* Price comparison */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mt-4 items-center">
        {/* Polymarket */}
        <div className="bg-[#F7F7F7] rounded-xl px-4 py-3">
          <div className="text-[11px] text-[#8C8C8C] font-medium mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D0D0D]" />
            Polymarket
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-[22px] font-bold',
              pmHigher === true ? 'text-[#00C805]' : pmHigher === false ? 'text-[#FF5000]' : 'text-[#0D0D0D]'
            )}>
              {pmYes != null ? `${(pmYes * 100).toFixed(0)}¢` : '—'}
            </span>
            <span className="text-[12px] text-[#8C8C8C]">YES</span>
          </div>
          <div className="text-[12px] text-[#8C8C8C] mt-1">
            Vol: ${(polymarket.volume / 1000).toFixed(0)}K
          </div>
        </div>

        {/* Delta */}
        <div className="text-center shrink-0">
          {price_diff_pct != null ? (
            <div>
              <div className={cn(
                'text-[13px] font-bold',
                price_diff_pct > 5 ? 'text-[#FF5000]' : 'text-[#8C8C8C]'
              )}>
                {price_diff_pct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-[#8C8C8C]">spread</div>
            </div>
          ) : (
            <span className="text-[#8C8C8C] text-[12px]">vs</span>
          )}
        </div>

        {/* Kalshi */}
        <div className="bg-[#F7F7F7] rounded-xl px-4 py-3">
          <div className="text-[11px] text-[#8C8C8C] font-medium mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Kalshi
          </div>
          {kalshiYes != null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  'text-[22px] font-bold',
                  pmHigher === false ? 'text-[#00C805]' : pmHigher === true ? 'text-[#FF5000]' : 'text-[#0D0D0D]'
                )}>
                  {(kalshiYes * 100).toFixed(0)}¢
                </span>
                <span className="text-[12px] text-[#8C8C8C]">YES</span>
              </div>
              {kalshi_stats && (
                <div className="text-[12px] text-[#8C8C8C] mt-1">
                  {kalshi_stats.trade_count} trades
                </div>
              )}
            </>
          ) : (
            <div className="text-[14px] text-[#8C8C8C]">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
