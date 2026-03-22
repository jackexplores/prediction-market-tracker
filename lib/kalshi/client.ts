const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2'

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'prediction-market-tracker/1.0',
}

async function fetchWithBackoff(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: DEFAULT_HEADERS, next: { revalidate: 0 } })
    if (res.status === 429) {
      const wait = Math.pow(2, i) * 2000 + Math.random() * 1000
      await new Promise(r => setTimeout(r, wait))
      continue
    }
    return res
  }
  throw new Error(`Kalshi fetch failed after ${retries} retries`)
}

export async function getKalshiMarkets(limit = 100, cursor?: string) {
  const params = new URLSearchParams({ limit: String(limit), status: 'open' })
  if (cursor) params.set('cursor', cursor)
  const url = `${KALSHI_API}/markets?${params}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return { markets: [], cursor: null }
  const data = await res.json()
  return { markets: data.markets ?? [], cursor: data.cursor ?? null }
}

export async function getKalshiTrades(ticker: string, limit = 100) {
  const url = `${KALSHI_API}/markets/${ticker}/trades?limit=${limit}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.trades ?? []
}

export async function getKalshiOrderbook(ticker: string) {
  const url = `${KALSHI_API}/markets/${ticker}/orderbook`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return null
  return res.json()
}

export async function getKalshiEvents(limit = 100, cursor?: string) {
  const params = new URLSearchParams({ limit: String(limit), status: 'open' })
  if (cursor) params.set('cursor', cursor)
  const url = `${KALSHI_API}/events?${params}`
  const res = await fetchWithBackoff(url)
  if (!res.ok) return { events: [], cursor: null }
  const data = await res.json()
  return { events: data.events ?? [], cursor: data.cursor ?? null }
}

// Fuzzy title matching score (0–1)
export function titleMatchScore(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  const wordsA = new Set(na.split(' '))
  const wordsB = new Set(nb.split(' '))
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}
