import { LeaderboardEntry, TimeWindow } from '@/lib/types'

const DATA_API = 'https://data-api.polymarket.com'
const GAMMA_API = 'https://gamma-api.polymarket.com'

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'prediction-market-tracker/1.0',
}

async function fetchWithBackoff(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: DEFAULT_HEADERS, next: { revalidate: 0 } })
    if (res.status === 429) {
      const wait = Math.pow(2, i) * 1000 + Math.random() * 500
      await new Promise(r => setTimeout(r, wait))
      continue
    }
    return res
  }
  throw new Error(`Failed after ${retries} retries`)
}

export async function getLeaderboard(timeWindow: TimeWindow = 'all', limit = 100): Promise<LeaderboardEntry[]> {
  const url = `${DATA_API}/v1/leaderboard?window=${timeWindow}&limit=${limit}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? data.leaderboard ?? [])
}

export async function getWalletActivity(address: string, since?: string, limit = 100) {
  const params = new URLSearchParams({ address, limit: String(limit) })
  if (since) params.set('since', since)
  const url = `${DATA_API}/activity?${params}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export async function getWalletTrades(address: string, since?: string, limit = 100) {
  const params = new URLSearchParams({ user: address, limit: String(limit) })
  if (since) params.set('after', since)
  const url = `${DATA_API}/trades?${params}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export async function getWalletPositions(address: string) {
  const url = `${DATA_API}/positions?address=${address}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export async function getMarkets(limit = 100, offset = 0) {
  const url = `${GAMMA_API}/markets?limit=${limit}&offset=${offset}&active=true`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export async function getEvents(limit = 100, offset = 0) {
  const url = `${GAMMA_API}/events?limit=${limit}&offset=${offset}&active=true`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data ?? [])
}

export function detectCategory(tags: string[], title: string, slug = ''): string {
  const text = (tags?.join(' ') + ' ' + title + ' ' + slug).toLowerCase()
  if (/btc|eth|sol|crypto|bitcoin|ethereum|solana|defi|nft|token|coin|matic|avax|doge|blockchain/.test(text)) return 'Crypto'
  if (/elect|president|congress|senate|vote|democrat|republican|primary|governor|government|politics/.test(text)) return 'Politics'
  if (/^(nba|nfl|mlb|nhl|cbb|ncaa|soccer|epl|ucl|mls|ufc|f1|pga|cfb)-/.test(slug) ||
      /nfl|nba|mlb|nhl|soccer|football|basketball|baseball|sport|champion|league|world cup|spread|moneyline|over\/under|o\/u/.test(text)) return 'Sports'
  if (/gdp|inflation|fed|interest rate|economy|stock|cpi|recession/.test(text)) return 'Economics'
  return 'Other'
}
