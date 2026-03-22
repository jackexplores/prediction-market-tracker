'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trade } from '@/lib/types'
import { formatCurrency, truncateWallet, timeAgo, cn } from '@/lib/utils'

const CATEGORIES = ['all', 'Politics', 'Crypto', 'Sports', 'Economics', 'Other']
const MIN_SIZES = [
  { label: 'Any size', value: 0 },
  { label: '$100+', value: 100 },
  { label: '$500+', value: 500 },
  { label: '$1K+', value: 1000 },
  { label: '$5K+', value: 5000 },
  { label: '$10K+', value: 10000 },
]

interface TrackedTrader { id: string; username: string | null; wallet_address: string }

interface TradeFeedClientProps {
  initialTrades: Trade[]
  trackedTraders: TrackedTrader[]
}

export function TradeFeedClient({ initialTrades, trackedTraders }: TradeFeedClientProps) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades)
  const [category, setCategory] = useState('all')
  const [minSize, setMinSize] = useState(0)
  const [selectedTrader, setSelectedTrader] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [newCount, setNewCount] = useState(0)

  const fetchTrades = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (category !== 'all') params.set('category', category)
      if (minSize > 0) params.set('min_size', String(minSize))
      if (selectedTrader !== 'all') params.set('trader_id', selectedTrader)

      const res = await fetch(`/api/trades?${params}`)
      const data = await res.json()
      const newTrades: Trade[] = data.trades ?? []

      if (!showLoading && newTrades.length > 0 && trades.length > 0) {
        const latestKnown = trades[0]?.timestamp
        const actuallyNew = newTrades.filter(t => t.timestamp > latestKnown)
        if (actuallyNew.length > 0) setNewCount(prev => prev + actuallyNew.length)
      }

      setTrades(newTrades)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [category, minSize, selectedTrader, trades])

  // Initial load on filter change
  useEffect(() => {
    fetchTrades(true)
  }, [category, minSize, selectedTrader]) // eslint-disable-line

  // Poll every 60s
  useEffect(() => {
    const interval = setInterval(() => fetchTrades(false), 60_000)
    return () => clearInterval(interval)
  }, [fetchTrades])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category */}
        <div className="flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn('pill', category === c && 'active')}
            >
              {c === 'all' ? 'All Categories' : c}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#E8E8E8]" />

        {/* Min size */}
        <select
          value={minSize}
          onChange={e => setMinSize(Number(e.target.value))}
          className="text-[13px] border border-[#E8E8E8] rounded-full px-3 py-1.5 text-[#0D0D0D] bg-white outline-none focus:border-[#0D0D0D] cursor-pointer"
        >
          {MIN_SIZES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Trader filter */}
        <select
          value={selectedTrader}
          onChange={e => setSelectedTrader(e.target.value)}
          className="text-[13px] border border-[#E8E8E8] rounded-full px-3 py-1.5 text-[#0D0D0D] bg-white outline-none focus:border-[#0D0D0D] cursor-pointer max-w-[160px]"
        >
          <option value="all">All Traders</option>
          {trackedTraders.map(t => (
            <option key={t.id} value={t.id}>
              {t.username ?? truncateWallet(t.wallet_address)}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          {newCount > 0 && (
            <button
              onClick={() => { setNewCount(0); fetchTrades(true) }}
              className="text-[13px] font-medium text-[#00C805] border border-[#00C805]/20 bg-[#F0FFF0] px-3 py-1.5 rounded-full"
            >
              +{newCount} new trades — refresh
            </button>
          )}
          <span className="text-[12px] text-[#8C8C8C]">
            Updated {timeAgo(lastRefresh)}
          </span>
        </div>
      </div>

      {/* Trade list */}
      {loading ? (
        <FeedSkeleton />
      ) : trades.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="flex flex-col gap-2">
          {trades.map(trade => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  )
}

function TradeCard({ trade }: { trade: Trade }) {
  const isBuy = trade.side === 'BUY'
  const trader = trade.traders as { username?: string | null; wallet_address?: string; profile_image?: string | null; rank_all?: number | null; verified?: boolean } | undefined
  const isTop10 = trader?.rank_all != null && trader.rank_all <= 10

  return (
    <div className={cn(
      'card px-5 py-4 flex items-center gap-4',
      isBuy ? 'side-bar-buy' : 'side-bar-sell',
      isBuy ? 'bg-profit-subtle' : 'bg-loss-subtle'
    )}>
      {/* Avatar + trader */}
      <Link
        href={`/traders/${trader?.wallet_address ?? ''}`}
        className="flex items-center gap-2.5 min-w-0 w-40 shrink-0 group"
        onClick={e => e.stopPropagation()}
      >
        <TraderMiniAvatar trader={trader} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-semibold text-[#0D0D0D] truncate group-hover:underline">
              {trader?.username ?? truncateWallet(trader?.wallet_address ?? '')}
            </span>
            {trader?.verified && <span className="text-[#00C805] text-[11px]">✓</span>}
          </div>
          {isTop10 && (
            <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wide">
              #{trader?.rank_all} ranked
            </span>
          )}
        </div>
      </Link>

      {/* Market */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#0D0D0D] truncate leading-snug">
          {trade.market_title ?? trade.market_slug}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {trade.category && (
            <span className="text-[11px] text-[#8C8C8C] font-medium">
              {trade.category}
            </span>
          )}
          {trade.outcome && (
            <span className={cn(
              'text-[11px] font-bold px-1.5 py-0.5 rounded',
              isBuy ? 'text-[#00C805] bg-[#00C805]/10' : 'text-[#FF5000] bg-[#FF5000]/10'
            )}>
              {isBuy ? 'BUY' : 'SELL'} {trade.outcome}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right w-16">
        <div className="text-[14px] font-semibold text-[#0D0D0D]">
          {trade.price != null ? `${(trade.price * 100).toFixed(0)}¢` : '—'}
        </div>
        <div className="text-[11px] text-[#8C8C8C]">price</div>
      </div>

      {/* Size */}
      <div className="shrink-0 text-right w-20">
        <div className={cn(
          'text-[15px] font-bold',
          isBuy ? 'text-[#00C805]' : 'text-[#FF5000]'
        )}>
          {trade.usdc_size != null ? formatCurrency(trade.usdc_size, true) : '—'}
        </div>
        <div className="text-[11px] text-[#8C8C8C]">size</div>
      </div>

      {/* Time */}
      <div className="shrink-0 text-right w-16 hidden sm:block">
        <div className="text-[12px] text-[#8C8C8C]">{timeAgo(trade.timestamp)}</div>
      </div>
    </div>
  )
}

function TraderMiniAvatar({ trader }: { trader?: { username?: string | null; wallet_address?: string; profile_image?: string | null } }) {
  if (trader?.profile_image) {
    return (
      <img
        src={trader.profile_image}
        alt=""
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    )
  }
  const initials = trader?.username?.slice(0, 2).toUpperCase() ?? (trader?.wallet_address?.slice(2, 4).toUpperCase() ?? '??')
  return (
    <div className="w-8 h-8 rounded-full bg-[#0D0D0D] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-[10px] font-bold">{initials}</span>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card px-5 py-4 flex items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="flex-1">
            <div className="skeleton w-2/3 h-4 mb-2" />
            <div className="skeleton w-1/3 h-3" />
          </div>
          <div className="skeleton w-16 h-5" />
          <div className="skeleton w-16 h-5" />
        </div>
      ))}
    </div>
  )
}

function EmptyFeed() {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">🔄</div>
      <h3 className="text-[16px] font-semibold text-[#0D0D0D] mb-2">Feed is empty</h3>
      <p className="text-[14px] text-[#8C8C8C] max-w-sm">
        Activity is synced from Polymarket every 5 minutes. Data will appear once the first sync completes.
      </p>
    </div>
  )
}
