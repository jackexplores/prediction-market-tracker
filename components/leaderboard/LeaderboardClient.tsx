'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Trader, TimeWindow, Category } from '@/lib/types'
import { formatCurrency, formatPercent, truncateWallet, pnlColor, timeAgo } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { Sparkline } from '@/components/leaderboard/Sparkline'
import { AiObservationsSkeleton } from '@/components/shared/AiObservations'
import { cn } from '@/lib/utils'

const AiObservations = dynamic(
  () => import('@/components/shared/AiObservations').then(m => ({ default: m.AiObservations })),
  { ssr: false, loading: () => <AiObservationsSkeleton /> }
)

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

type TraderWithPeriod = Trader & { period_volume?: number; period_pnl?: number; period_rank?: number }

interface LeaderboardClientProps {
  initialTraders: Trader[]
}

export function LeaderboardClient({ initialTraders }: LeaderboardClientProps) {
  const [traders, setTraders] = useState<TraderWithPeriod[]>(initialTraders)
  const [window, setWindow] = useState<TimeWindow>('1d')
  const [category, setCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'pnl' | 'volume' | 'markets_traded'>('pnl')
  const [loading, setLoading] = useState(false)
  const [rotateDeg, setRotateDeg] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const fetchTraders = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    try {
      const params = new URLSearchParams({ window, category, limit: '100' })
      const res = await fetch(`/api/leaderboard?${params}`, { signal: abortRef.current.signal })
      const data = await res.json()
      setTraders(data.traders ?? [])
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    } finally {
      setLoading(false)
    }
  }, [window, category])

  useEffect(() => {
    fetchTraders()
  }, [fetchTraders])

  const sorted = [...traders].sort((a, b) => {
    if (sortBy === 'volume') {
      const aVol = window !== 'all' ? (a.period_volume ?? a.total_volume) : a.total_volume
      const bVol = window !== 'all' ? (b.period_volume ?? b.total_volume) : b.total_volume
      return bVol - aVol
    }
    if (sortBy === 'markets_traded') return (b.markets_traded ?? 0) - (a.markets_traded ?? 0)
    // For PnL: use period_pnl when in a period window, total_pnl for all-time
    const aPnl = window !== 'all' ? (a.period_pnl ?? a.total_pnl) : a.total_pnl
    const bPnl = window !== 'all' ? (b.period_pnl ?? b.total_pnl) : b.total_pnl
    return bPnl - aPnl
  })

  const isPeriod = window !== 'all'

  const leaderboardSummary = buildLeaderboardSummary(sorted, window, category)

  return (
    <div>
      {/* AI Observations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AiObservations page="leaderboard" filters={{ window, category }} dataSummary={leaderboardSummary} />
      </div>

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

            {/* Refresh button */}
            <button
              onClick={() => { setRotateDeg(d => d + 180); fetchTraders() }}
              disabled={loading}
              className="ml-auto shrink-0 flex items-center gap-1.5 text-[13px] font-medium text-[#8C8C8C] hover:text-[#0D0D0D] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                className="refresh-icon"
                style={{ transform: `rotate(${rotateDeg}deg)` }}
              >
                <path d="M21 12a9 9 0 0 0-15.39-6.36L3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12a9 9 0 0 0 15.39 6.36L21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21v-5h-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {loading ? (
          <LeaderboardSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState onRefresh={fetchTraders} />
        ) : (
          <div className="card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[48px_1fr_140px_140px_100px_100px_80px] gap-4 px-6 py-3 border-b border-[#E8E8E8] bg-[#F7F7F7]">
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
                {isPeriod ? 'Volume (period)' : 'Volume'} {sortBy === 'volume' && '↓'}
              </button>
              <button
                onClick={() => setSortBy('markets_traded')}
                className={cn(
                  'text-[12px] font-medium uppercase tracking-wide text-left transition-colors',
                  sortBy === 'markets_traded' ? 'text-[#0D0D0D]' : 'text-[#8C8C8C]'
                )}
              >
                Markets {sortBy === 'markets_traded' && '↓'}
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
              const rank = (trader as TraderWithPeriod & { period_rank?: number }).period_rank ?? i + 1
              const isTop10 = rank <= 10
              const displayVolume = isPeriod
                ? (trader.period_volume ?? trader.total_volume)
                : trader.total_volume
              return (
                <Link
                  key={trader.id}
                  href={`/traders/${trader.wallet_address}`}
                  className={cn(
                    'grid grid-cols-[48px_1fr_140px_140px_100px_100px_80px] gap-4 px-6 py-4 items-center table-row-hover border-b border-[#E8E8E8] last:border-0 transition-colors',
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

                  {/* PnL (period or all-time) */}
                  <div>
                    {(() => {
                      const displayPnl = isPeriod ? (trader.period_pnl ?? trader.total_pnl) : trader.total_pnl
                      return (
                        <span className={cn('text-[15px] font-bold tabular-nums', pnlColor(displayPnl))}>
                          {displayPnl >= 0 ? '+' : ''}{formatCurrency(displayPnl, true)}
                        </span>
                      )
                    })()}
                  </div>

                  {/* Volume */}
                  <span className="text-[14px] text-[#0D0D0D] tabular-nums font-medium">
                    {formatCurrency(displayVolume, true)}
                  </span>

                  {/* Markets traded */}
                  <span className="text-[14px] text-[#0D0D0D] tabular-nums font-medium">
                    {(trader.markets_traded ?? 0).toLocaleString()}
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
          Showing {sorted.length} traders · Ranked by PnL in selected period · Refreshes every 15 min
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

function buildLeaderboardSummary(traders: TraderWithPeriod[], timeWindow: TimeWindow, cat: string): string {
  if (traders.length === 0) return ''

  const isPeriod = timeWindow !== 'all'
  const windowLabel = { '1d': '24 Hours', '7d': '7 Days', '30d': '30 Days', 'all': 'All Time' }[timeWindow] ?? timeWindow
  const getPnl = (t: TraderWithPeriod) => isPeriod ? (t.period_pnl ?? t.total_pnl) : t.total_pnl
  const getVol = (t: TraderWithPeriod) => isPeriod ? (t.period_volume ?? t.total_volume) : t.total_volume

  const profitable = traders.filter(t => getPnl(t) > 0).length
  const totalPnl = traders.reduce((s, t) => s + getPnl(t), 0)
  const totalVol = traders.reduce((s, t) => s + getVol(t), 0)
  const avgPnl = traders.length > 0 ? totalPnl / traders.length : 0

  const fmt = (n: number) => {
    const abs = Math.abs(n)
    const prefix = n >= 0 ? '+$' : '-$'
    if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(1)}K`
    return `${prefix}${abs.toFixed(0)}`
  }

  const top10 = traders.slice(0, 10)
  const topLines = top10.map((t, i) => {
    const name = t.username ?? t.wallet_address.slice(0, 8)
    return `${i + 1}. ${name}: ${fmt(getPnl(t))} PnL, ${fmt(getVol(t))} vol, ${t.markets_traded ?? 0} markets`
  }).join('\n')

  return `Leaderboard: ${windowLabel} window, ${cat === 'all' ? 'all categories' : cat} (${traders.length} traders shown)
Profitable: ${profitable}/${traders.length} | Total PnL: ${fmt(totalPnl)} | Total Vol: ${fmt(totalVol)} | Avg PnL: ${fmt(avgPnl)}

Top 10 by PnL:
${topLines}`
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

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4">📊</div>
      <h3 className="text-[16px] font-semibold text-[#0D0D0D] mb-2">No traders found</h3>
      <p className="text-[14px] text-[#8C8C8C] max-w-sm mb-6">
        No traders ranked for this period yet. Try a different time window or category.
      </p>
      <button
        onClick={onRefresh}
        className="pill active"
      >
        Try again
      </button>
    </div>
  )
}
