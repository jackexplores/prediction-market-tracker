'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Trader, TimeWindow, Category } from '@/lib/types'
import { formatCurrency, formatPercent, truncateWallet, pnlColor, timeAgo } from '@/lib/utils'
import { Sparkline } from '@/components/leaderboard/Sparkline'
import { cn } from '@/lib/utils'

const WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: '30 Days' },
  { value: '7d', label: '7 Days' },
  { value: '1d', label: '24 Hours' },
]

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Politics', label: 'Politics' },
  { value: 'Crypto', label: 'Crypto' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Other', label: 'Other' },
]

interface LeaderboardClientProps {
  initialTraders: Trader[]
}

export function LeaderboardClient({ initialTraders }: LeaderboardClientProps) {
  const [traders, setTraders] = useState<Trader[]>(initialTraders)
  const [window, setWindow] = useState<TimeWindow>('all')
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'pnl' | 'volume' | 'win_rate'>('pnl')
  const [loading, setLoading] = useState(false)

  const fetchTraders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ window, category, limit: '100' })
      const res = await fetch(`/api/leaderboard?${params}`)
      const data = await res.json()
      setTraders(data.traders ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [window, category])

  useEffect(() => {
    fetchTraders()
  }, [fetchTraders])

  const rankCol = window === 'all' ? 'rank_all'
    : window === '30d' ? 'rank_30d'
    : window === '7d' ? 'rank_7d'
    : 'rank_1d'

  const sorted = [...traders].sort((a, b) => {
    if (sortBy === 'volume') return b.total_volume - a.total_volume
    if (sortBy === 'win_rate') return b.win_rate - a.win_rate
    return b.total_pnl - a.total_pnl
  })

  return (
    <div>
      {/* Filter bar */}
      <div className="sticky top-14 z-40 bg-white border-b border-[#E8E8E8] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 overflow-x-auto">
            {/* Time window pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {WINDOWS.map(w => (
                <button
                  key={w.value}
                  onClick={() => setWindow(w.value)}
                  className={cn('pill', window === w.value && 'active')}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-[#E8E8E8] shrink-0" />

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn('pill', category === c.value && 'active')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <LeaderboardSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[48px_1fr_140px_120px_100px_100px_80px] gap-4 px-6 py-3 border-b border-[#E8E8E8] bg-[#F7F7F7]">
              <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide">#</span>
              <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide">Trader</span>
              <button
                onClick={() => setSortBy('pnl')}
                className={cn(
                  'text-[12px] font-medium uppercase tracking-wide text-left transition-colors',
                  sortBy === 'pnl' ? 'text-[#0D0D0D]' : 'text-[#8C8C8C]'
                )}
              >
                PnL {sortBy === 'pnl' && '↓'}
              </button>
              <button
                onClick={() => setSortBy('volume')}
                className={cn(
                  'text-[12px] font-medium uppercase tracking-wide text-left transition-colors',
                  sortBy === 'volume' ? 'text-[#0D0D0D]' : 'text-[#8C8C8C]'
                )}
              >
                Volume {sortBy === 'volume' && '↓'}
              </button>
              <button
                onClick={() => setSortBy('win_rate')}
                className={cn(
                  'text-[12px] font-medium uppercase tracking-wide text-left transition-colors',
                  sortBy === 'win_rate' ? 'text-[#0D0D0D]' : 'text-[#8C8C8C]'
                )}
              >
                Win Rate {sortBy === 'win_rate' && '↓'}
              </button>
              <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide hidden md:block">
                Trend
              </span>
              <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide hidden lg:block">
                Active
              </span>
            </div>

            {/* Rows */}
            {sorted.map((trader, i) => {
              const traderRecord = trader as unknown as Record<string, number | null>
              const rank = traderRecord[rankCol] ?? i + 1
              const isTop10 = rank <= 10
              return (
                <Link
                  key={trader.id}
                  href={`/traders/${trader.wallet_address}`}
                  className={cn(
                    'grid grid-cols-[48px_1fr_140px_120px_100px_100px_80px] gap-4 px-6 py-4 items-center table-row-hover border-b border-[#E8E8E8] last:border-0 transition-colors',
                    isTop10 && 'bg-[#FAFFF9]'
                  )}
                >
                  {/* Rank */}
                  <span className={cn(
                    'text-[15px] font-bold tabular-nums',
                    isTop10 ? 'text-[#0D0D0D]' : 'text-[#8C8C8C]'
                  )}>
                    {rank}
                  </span>

                  {/* Trader */}
                  <div className="flex items-center gap-3 min-w-0">
                    <TraderAvatar trader={trader} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-[#0D0D0D] truncate">
                          {trader.username ?? truncateWallet(trader.wallet_address)}
                        </span>
                        {trader.verified && (
                          <span className="text-[#00C805] text-[12px]">✓</span>
                        )}
                        {isTop10 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0D0D0D] text-white rounded-full">
                            TOP 10
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-[#8C8C8C] font-mono">
                        {truncateWallet(trader.wallet_address)}
                      </span>
                    </div>
                  </div>

                  {/* PnL */}
                  <div>
                    <span className={cn('text-[15px] font-bold tabular-nums', pnlColor(trader.total_pnl))}>
                      {trader.total_pnl >= 0 ? '+' : ''}{formatCurrency(trader.total_pnl, true)}
                    </span>
                  </div>

                  {/* Volume */}
                  <span className="text-[14px] text-[#0D0D0D] tabular-nums font-medium">
                    {formatCurrency(trader.total_volume, true)}
                  </span>

                  {/* Win rate */}
                  <span className="text-[14px] text-[#0D0D0D] tabular-nums font-medium">
                    {formatPercent(trader.win_rate)}
                  </span>

                  {/* Sparkline */}
                  <div className="hidden md:flex items-center">
                    <Sparkline traderId={trader.id} positive={trader.total_pnl >= 0} />
                  </div>

                  {/* Last active */}
                  <span className="text-[12px] text-[#8C8C8C] hidden lg:block">
                    {timeAgo(trader.last_synced_at)}
                  </span>
                </Link>
              )
            })}
          </div>
        )}

        <p className="mt-4 text-[12px] text-[#8C8C8C] text-center">
          Showing {sorted.length} traders · Data from Polymarket public API · Refreshes every 15 min
        </p>
      </div>
    </div>
  )
}

function TraderAvatar({ trader, size = 36 }: { trader: Trader; size?: number }) {
  const initials = trader.username?.slice(0, 2).toUpperCase() ?? trader.wallet_address.slice(2, 4).toUpperCase()
  const colors = ['#0D0D0D', '#374151', '#1f2937', '#111827']
  const colorIdx = trader.wallet_address.charCodeAt(2) % colors.length

  if (trader.profile_image) {
    return (
      <img
        src={trader.profile_image}
        alt={trader.username ?? 'Trader'}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
      style={{ width: size, height: size, background: colors[colorIdx] }}
    >
      {initials}
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="card overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-[#E8E8E8]">
          <div className="skeleton w-8 h-5" />
          <div className="flex items-center gap-3 flex-1">
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <div className="skeleton w-24 h-4" />
              <div className="skeleton w-16 h-3" />
            </div>
          </div>
          <div className="skeleton w-20 h-5" />
          <div className="skeleton w-16 h-5" />
          <div className="skeleton w-12 h-5" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-[16px] font-semibold text-[#0D0D0D] mb-2">No traders yet</h3>
      <p className="text-[14px] text-[#8C8C8C] max-w-sm">
        The leaderboard syncs from Polymarket every 15 minutes. Check back shortly or trigger a manual sync.
      </p>
    </div>
  )
}
