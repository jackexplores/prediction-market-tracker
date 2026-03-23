export interface Trader {
  id: string
  wallet_address: string
  username: string | null
  profile_image: string | null
  x_username: string | null
  verified: boolean
  total_pnl: number
  total_volume: number
  markets_traded: number
  pnl_1d: number
  pnl_7d: number
  pnl_30d: number
  volume_1d: number
  volume_7d: number
  volume_30d: number
  rank_all: number | null
  rank_30d: number | null
  rank_7d: number | null
  rank_1d: number | null
  last_synced_at: string
  created_at: string
}

export interface Trade {
  id: string
  trader_id: string
  market_slug: string
  market_title: string | null
  category: string | null
  side: 'BUY' | 'SELL'
  outcome: string | null
  price: number | null
  usdc_size: number | null
  timestamp: string
  tx_hash: string | null
  created_at: string
  traders?: Pick<Trader, 'username' | 'wallet_address' | 'profile_image' | 'rank_all' | 'verified'>
}

export interface Market {
  id: string
  platform: 'polymarket' | 'kalshi'
  slug_or_ticker: string
  title: string
  category: string | null
  outcomes: Record<string, number> | null
  current_prices: Record<string, number> | null
  volume: number
  status: string
  resolved_at: string | null
}

export interface KalshiTradeStat {
  id: string
  ticker: string
  total_volume: number
  trade_count: number
  last_yes_price: number | null
  last_no_price: number | null
  last_updated: string
}

export interface LeaderboardEntry {
  rank: number
  proxyWallet: string
  userName: string | null
  vol: number
  pnl: number
  profileImage: string | null
  xUsername: string | null
  verifiedBadge: boolean
}

export type TimeWindow = '1d' | '7d' | '30d' | 'all'

export type Category = 'Politics' | 'Crypto' | 'Sports' | 'Economics' | 'Other' | 'all'

export interface TraderWithPnlHistory extends Trader {
  pnl_history?: { timestamp: string; pnl: number }[]
}

export interface CrossPlatformMarket {
  polymarket: Market
  kalshi: Market | null
  kalshi_stats: KalshiTradeStat | null
  price_diff_pct: number | null
}
