'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trader, Trade } from '@/lib/types'
import { formatCurrency, formatPercent, truncateWallet, pnlColor, timeAgo, cn } from '@/lib/utils'
import { CategoryChart } from '@/components/profile/CategoryChart'

interface Props {
  data: {
    trader: Trader
    trades: Trade[]
    category_breakdown: Record<string, { volume: number; count: number }>
  }
}

export function TraderProfileClient({ data }: Props) {
  const { trader, trades, category_breakdown } = data
  const [copied, setCopied] = useState(false)
  const [tradeSortBy, setTradeSortBy] = useState<'date' | 'size'>('date')

  const copyWallet = () => {
    navigator.clipboard.writeText(trader.wallet_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const sortedTrades = [...trades].sort((a, b) => {
    if (tradeSortBy === 'size') return (b.usdc_size ?? 0) - (a.usdc_size ?? 0)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const buyCount = trades.filter(t => t.side === 'BUY').length
  const avgSize = trades.length > 0
    ? trades.reduce((s, t) => s + (t.usdc_size ?? 0), 0) / trades.length
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link href="/" className="text-[13px] text-[#8C8C8C] hover:text-[#0D0D0D] mb-6 block">
        ← Back to Leaderboard
      </Link>

      {/* Profile header */}
      <div className="card px-6 py-6 mb-6">
        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <div className="shrink-0">
            {trader.profile_image ? (
              <img
                src={trader.profile_image}
                alt={trader.username ?? 'Trader'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#0D0D0D] flex items-center justify-center">
                <span className="text-white text-[18px] font-bold">
                  {(trader.username?.slice(0, 2) ?? trader.wallet_address.slice(2, 4)).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-[22px] font-bold text-[#0D0D0D]">
                {trader.username ?? truncateWallet(trader.wallet_address)}
              </h1>
              {trader.verified && (
                <span className="text-[#00C805] font-bold">✓ Verified</span>
              )}
              {trader.rank_all && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-[#0D0D0D] text-white rounded-full">
                  #{trader.rank_all} All Time
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyWallet}
                className="flex items-center gap-1.5 text-[13px] text-[#8C8C8C] font-mono hover:text-[#0D0D0D] transition-colors"
              >
                {truncateWallet(trader.wallet_address, 8)}
                <span className="text-[11px]">{copied ? '✓ Copied' : '⎘'}</span>
              </button>

              {trader.x_username && (
                <a
                  href={`https://x.com/${trader.x_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#8C8C8C] hover:text-[#0D0D0D] transition-colors"
                >
                  @{trader.x_username} ↗
                </a>
              )}
            </div>

            <p className="text-[12px] text-[#8C8C8C] mt-1">
              Last synced {timeAgo(trader.last_synced_at)}
            </p>
          </div>

          {/* Alert button */}
          <Link
            href={`/alerts?trader=${trader.id}`}
            className="shrink-0 px-4 py-2 bg-[#0D0D0D] text-white text-[13px] font-semibold rounded-full hover:bg-[#374151] transition-colors"
          >
            Follow
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-5 border-t border-[#E8E8E8]">
          <StatCard
            label="Total PnL"
            value={`${trader.total_pnl >= 0 ? '+' : ''}${formatCurrency(trader.total_pnl, true)}`}
            valueClass={pnlColor(trader.total_pnl)}
          />
          <StatCard label="Volume" value={formatCurrency(trader.total_volume, true)} />
          <StatCard label="Markets" value={(trader.markets_traded ?? 0).toLocaleString()} />
          <StatCard label="Trades" value={trades.length.toLocaleString()} />
          <StatCard label="Avg Size" value={formatCurrency(avgSize, true)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade history */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E8]">
              <h2 className="text-[15px] font-bold text-[#0D0D0D]">Trade History</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTradeSortBy('date')}
                  className={cn('pill py-1 px-3 text-[12px]', tradeSortBy === 'date' && 'active')}
                >
                  Date
                </button>
                <button
                  onClick={() => setTradeSortBy('size')}
                  className={cn('pill py-1 px-3 text-[12px]', tradeSortBy === 'size' && 'active')}
                >
                  Size
                </button>
              </div>
            </div>

            {sortedTrades.length === 0 ? (
              <div className="py-12 text-center text-[14px] text-[#8C8C8C]">
                No trades synced yet
              </div>
            ) : (
              <div className="divide-y divide-[#E8E8E8]">
                {sortedTrades.map(trade => {
                  const isBuy = trade.side === 'BUY'
                  return (
                    <div
                      key={trade.id}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3.5',
                        isBuy ? 'side-bar-buy' : 'side-bar-sell'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0D0D0D] truncate">
                          {trade.market_title ?? trade.market_slug}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            'text-[11px] font-bold',
                            isBuy ? 'text-[#00C805]' : 'text-[#FF5000]'
                          )}>
                            {trade.side} {trade.outcome ?? ''}
                          </span>
                          {trade.category && (
                            <span className="text-[11px] text-[#8C8C8C]">{trade.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn('text-[13px] font-bold', isBuy ? 'text-[#00C805]' : 'text-[#FF5000]')}>
                          {trade.usdc_size != null ? formatCurrency(trade.usdc_size) : '—'}
                        </div>
                        <div className="text-[11px] text-[#8C8C8C]">
                          {trade.price != null ? `@ ${(trade.price * 100).toFixed(0)}¢` : ''}
                        </div>
                      </div>
                      <div className="text-[11px] text-[#8C8C8C] text-right shrink-0 w-14">
                        {timeAgo(trade.timestamp)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Category breakdown */}
          <div className="card px-5 py-5">
            <h2 className="text-[15px] font-bold text-[#0D0D0D] mb-4">Category Breakdown</h2>
            <CategoryChart data={category_breakdown} />
          </div>

          {/* Quick stats */}
          <div className="card px-5 py-5">
            <h2 className="text-[15px] font-bold text-[#0D0D0D] mb-4">Activity</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-[13px] text-[#8C8C8C]">Buy trades</span>
                <span className="text-[13px] font-semibold text-[#00C805]">{buyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-[#8C8C8C]">Sell trades</span>
                <span className="text-[13px] font-semibold text-[#FF5000]">{trades.length - buyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-[#8C8C8C]">Markets traded</span>
                <span className="text-[13px] font-semibold text-[#0D0D0D]">
                  {new Set(trades.map(t => t.market_slug)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-[#8C8C8C]">Rank (30d)</span>
                <span className="text-[13px] font-semibold text-[#0D0D0D]">
                  {trader.rank_30d != null ? `#${trader.rank_30d}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-[#8C8C8C]">Rank (7d)</span>
                <span className="text-[13px] font-semibold text-[#0D0D0D]">
                  {trader.rank_7d != null ? `#${trader.rank_7d}` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className={cn('text-[22px] font-bold animate-count', valueClass ?? 'text-[#0D0D0D]')}>
        {value}
      </div>
      <div className="text-[12px] text-[#8C8C8C] font-medium mt-0.5">{label}</div>
    </div>
  )
}
