'use client'

import { useState } from 'react'
import { truncateWallet, formatCurrency, cn } from '@/lib/utils'

interface Trader {
  id: string
  username: string | null
  wallet_address: string
  rank_all: number | null
  total_pnl: number
}

interface Props {
  traders: Trader[]
}

export function AlertsClient({ traders }: Props) {
  const [channel, setChannel] = useState<'webhook' | 'email'>('webhook')
  const [traderId, setTraderId] = useState<string>('')
  const [endpoint, setEndpoint] = useState('')
  const [minSize, setMinSize] = useState(500)
  const [cooldown, setCooldown] = useState(60)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!traderId || !endpoint) {
      setError('Please select a trader and enter an endpoint.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trader_id: traderId,
          channel,
          endpoint,
          min_size_usd: minSize,
          cooldown_mins: cooldown,
          user_email: channel === 'email' ? endpoint : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSuccess(true)
      setEndpoint('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="card p-6">
        <h2 className="text-[17px] font-bold text-[#0D0D0D] mb-6">Create Alert</h2>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-[16px] font-semibold text-[#0D0D0D] mb-2">Alert created!</h3>
            <p className="text-[14px] text-[#8C8C8C] mb-5">
              You&apos;ll be notified when this trader executes a trade above your threshold.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="px-4 py-2 bg-[#0D0D0D] text-white text-[13px] font-semibold rounded-full"
            >
              Create another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Trader */}
            <div>
              <label className="text-[13px] font-semibold text-[#0D0D0D] block mb-2">
                Trader to follow
              </label>
              {traders.length === 0 ? (
                <p className="text-[13px] text-[#8C8C8C]">No traders tracked yet — run a leaderboard sync first.</p>
              ) : (
                <select
                  value={traderId}
                  onChange={e => setTraderId(e.target.value)}
                  className="w-full border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-[14px] text-[#0D0D0D] outline-none focus:border-[#0D0D0D]"
                  required
                >
                  <option value="">Select a trader...</option>
                  {traders.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.rank_all} — {t.username ?? truncateWallet(t.wallet_address)} ({formatCurrency(t.total_pnl, true)} PnL)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Channel */}
            <div>
              <label className="text-[13px] font-semibold text-[#0D0D0D] block mb-2">
                Notification channel
              </label>
              <div className="flex gap-2">
                {(['webhook', 'email'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={cn('pill flex-1 justify-center', channel === c && 'active')}
                  >
                    {c === 'webhook' ? '🔗 Webhook' : '✉️ Email'}
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoint */}
            <div>
              <label className="text-[13px] font-semibold text-[#0D0D0D] block mb-2">
                {channel === 'webhook' ? 'Webhook URL' : 'Email address'}
              </label>
              <input
                type={channel === 'email' ? 'email' : 'url'}
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                placeholder={
                  channel === 'webhook'
                    ? 'https://discord.com/api/webhooks/...'
                    : 'you@example.com'
                }
                className="w-full border border-[#E8E8E8] rounded-xl px-4 py-2.5 text-[14px] text-[#0D0D0D] outline-none focus:border-[#0D0D0D] placeholder:text-[#8C8C8C]"
                required
              />
              {channel === 'webhook' && (
                <p className="text-[12px] text-[#8C8C8C] mt-1">
                  Works with Discord, Telegram, and any webhook receiver.
                </p>
              )}
            </div>

            {/* Min size */}
            <div>
              <label className="text-[13px] font-semibold text-[#0D0D0D] block mb-2">
                Minimum trade size (USDC): {formatCurrency(minSize)}
              </label>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={minSize}
                onChange={e => setMinSize(Number(e.target.value))}
                className="w-full accent-[#0D0D0D]"
              />
              <div className="flex justify-between text-[11px] text-[#8C8C8C] mt-1">
                <span>Any</span>
                <span>$10K</span>
              </div>
            </div>

            {/* Cooldown */}
            <div>
              <label className="text-[13px] font-semibold text-[#0D0D0D] block mb-2">
                Alert cooldown: {cooldown} min
              </label>
              <div className="flex gap-2">
                {[15, 30, 60, 180, 360].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCooldown(m)}
                    className={cn('pill py-1 text-[12px]', cooldown === m && 'active')}
                  >
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-[#FF5000]">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || traders.length === 0}
              className="w-full py-3 bg-[#0D0D0D] text-white text-[14px] font-semibold rounded-xl hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Alert'}
            </button>
          </form>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="card px-4 py-4">
          <div className="text-[20px] mb-1">🔗</div>
          <h3 className="text-[13px] font-bold text-[#0D0D0D] mb-1">Webhook alerts</h3>
          <p className="text-[12px] text-[#8C8C8C]">
            Works with Discord bots, Telegram bots, Zapier, and any HTTP endpoint.
          </p>
        </div>
        <div className="card px-4 py-4">
          <div className="text-[20px] mb-1">✉️</div>
          <h3 className="text-[13px] font-bold text-[#0D0D0D] mb-1">Email alerts</h3>
          <p className="text-[12px] text-[#8C8C8C]">
            Delivered via Resend. Includes market title, direction, size, and a link.
          </p>
        </div>
      </div>
    </div>
  )
}
