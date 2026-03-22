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

export function detectCategory(tags: string[], title: string): string {
  const text = (tags?.join(' ') + ' ' + title).toLowerCase()
  if (text.match(/crypto|bitcoin|btc|eth|solana|defi|nft|blockchain/)) return 'Crypto'
  if (text.match(/election|president|congress|senate|vote|politics|government|democrat|republican/)) return 'Politics'
  if (text.match(/nfl|nba|mlb|nhl|soccer|football|basketball|baseball|sport|champion|league|world cup/)) return 'Sports'
  if (text.match(/gdp|inflation|fed|interest rate|economy|market|stock|cpi|recession/)) return 'Economics'
  return 'Other'
}
