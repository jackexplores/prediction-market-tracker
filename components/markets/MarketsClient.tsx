'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PolymarketRow {
  id: string
  title: string
  slug: string
  category: string
  yesPrice: number | null
  volume: number
}

const CATEGORIES = ['All', 'Politics', 'Crypto', 'Sports', 'Economics', 'Other']

interface Props {
  markets: PolymarketRow[]
}

export function MarketsClient({ markets }: Props) {
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'volume' | 'price'>('volume')

  const filtered = category === 'All'
    ? markets
    : markets.filter(m => m.category === category)

  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'price'
      ? (b.yesPrice ?? 0) - (a.yesPrice ?? 0)
      : b.volume - a.volume
  )

  if (markets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-[16px] font-semibold text-[#0D0D0D] mb-2">Loading markets…</h3>
        <p className="text-[14px] text-[#8C8C8C] max-w-sm mx-auto">
          Fetching live market data from Polymarket.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Filters + sort */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map(c => {
            const count = c === 'All' ? markets.length : markets.filter(m => m.category === c).length
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn('pill', category === c && 'active')}
              >
                {c}
                {c !== 'All' && count > 0 && (
                  <span className="ml-1 opacity-60">({count})</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[12px] text-[#8C8C8C]">Sort:</span>
          <button onClick={() => setSortBy('volume')} className={cn('pill text-[12px]', sortBy === 'volume' && 'active')}>
            Volume
          </button>
          <button onClick={() => setSortBy('price')} className={cn('pill text-[12px]', sortBy === 'price' && 'active')}>
            YES Price
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_70px_100px] gap-4 px-5 py-3 bg-[#F7F7F7] border-b border-[#E8E8E8]">
          <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide">Market</span>
          <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide">Category</span>
          <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide text-right">YES</span>
          <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide text-right">Volume</span>
        </div>

        {sorted.length === 0 ? (
          <div className="px-5 py-12 text-center text-[14px] text-[#8C8C8C]">
            No markets in this category
          </div>
        ) : (
          sorted.map(market => <MarketRow key={market.id} market={market} />)
        )}
      </div>

      <p className="mt-4 text-[12px] text-[#8C8C8C] text-center">
        Showing {sorted.length} of {markets.length} markets · Polymarket · Cached 5 min
      </p>
    </div>
  )
}

function MarketRow({ market }: { market: PolymarketRow }) {
  const { yesPrice, volume } = market

  const priceColor = yesPrice == null ? ''
    : yesPrice >= 0.7 ? 'text-[#00C805]'
    : yesPrice <= 0.3 ? 'text-[#FF5000]'
    : 'text-[#0D0D0D]'

  const volStr = volume >= 1_000_000
    ? `$${(volume / 1_000_000).toFixed(1)}M`
    : volume >= 1_000
    ? `$${(volume / 1_000).toFixed(0)}K`
    : volume > 0
    ? `$${volume.toFixed(0)}`
    : '—'

  return (
    <a
      href={`https://polymarket.com/event/${market.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-[1fr_100px_70px_100px] gap-4 px-5 py-4 items-center table-row-hover border-b border-[#E8E8E8] last:border-0 transition-colors group"
    >
      <span className="text-[14px] font-medium text-[#0D0D0D] truncate group-hover:underline decoration-[#E8E8E8]">
        {market.title}
      </span>
      <span className="text-[11px] text-[#8C8C8C] font-medium truncate">
        {market.category}
      </span>
      <div className="text-right">
        {yesPrice != null ? (
          <span className={cn('text-[14px] font-bold tabular-nums', priceColor)}>
            {(yesPrice * 100).toFixed(0)}¢
          </span>
        ) : (
          <span className="text-[14px] text-[#8C8C8C]">—</span>
        )}
      </div>
      <div className="text-right">
        <span className="text-[14px] font-medium text-[#0D0D0D] tabular-nums">{volStr}</span>
      </div>
    </a>
  )
}
