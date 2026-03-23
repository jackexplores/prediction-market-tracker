import { NextRequest } from 'next/server'
import { streamCompletion } from '@/lib/openrouter'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are a concise prediction market analyst. Analyze trader activity data from Polymarket and provide brief, insightful observations. Rules:
- Write 3-5 bullet points, each 1-2 sentences
- Start each bullet with "• "
- Focus on patterns, outliers, and notable trends that aren't immediately obvious from the raw data
- Use specific numbers from the data
- Be direct and analytical, not conversational
- Never give financial advice or predictions about market outcomes
- If data is sparse, say so briefly rather than speculating`

// In-memory cache: key → { text, expiresAt }
const cache = new Map<string, { text: string; expiresAt: number }>()
const CACHE_TTL_MS = 20 * 60 * 1000 // 20 minutes

function cacheKey(page: string, filters: Record<string, string>, dataSummary: string): string {
  return `${page}:${JSON.stringify(filters)}:${dataSummary}`
}

function getCached(key: string): string | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
  return entry.text
}

function buildUserPrompt(page: string, filters: Record<string, string>, dataSummary: string): string {
  if (page === 'leaderboard') {
    const window = filters.window ?? 'all'
    const category = filters.category ?? 'all'
    const windowLabel = { '1d': '24 Hours', '7d': '7 Days', '30d': '30 Days', 'all': 'All Time' }[window] ?? window
    return `Analyze this Polymarket leaderboard data (${windowLabel} window, ${category === 'all' ? 'all categories' : category}):

${dataSummary}

Provide brief observations about trader performance patterns, profit concentration, and anything notable.`
  }

  const category = filters.category ?? 'all'
  const minSize = filters.minSize ?? '0'
  const minLabel = minSize === '0' ? 'any size' : `$${Number(minSize) >= 1000 ? `${Number(minSize) / 1000}K` : minSize}+`
  return `Analyze this recent Polymarket trade activity (${category === 'all' ? 'all categories' : category}, ${minLabel}):

${dataSummary}

Provide brief observations about trading patterns, market sentiment, notable large trades, and category trends.`
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI observations not configured' }), { status: 500 })
  }

  let body: { page: string; filters: Record<string, string>; dataSummary: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 })
  }

  const { page, filters, dataSummary } = body
  if (!dataSummary?.trim()) {
    return new Response(JSON.stringify({ error: 'No data to analyze' }), { status: 400 })
  }

  const key = cacheKey(page, filters, dataSummary)
  const cached = getCached(key)

  if (cached) {
    // Stream cached text immediately in small chunks for a natural feel
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const words = cached.split(' ')
        let i = 0
        function push() {
          if (i >= words.length) { controller.close(); return }
          const chunk = (i === 0 ? '' : ' ') + words[i++]
          controller.enqueue(encoder.encode(chunk))
          // ~5ms per word feels natural without being slow
          setTimeout(push, 5)
        }
        push()
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  let upstreamRes: Response
  try {
    upstreamRes = await streamCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(page, filters, dataSummary) },
    ])
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to connect to AI service' }), { status: 502 })
  }

  if (!upstreamRes.ok) {
    return new Response(JSON.stringify({ error: 'AI service error' }), { status: upstreamRes.status })
  }

  // Unwrap OpenRouter SSE stream, accumulate for cache, and forward plain text deltas
  let accumulated = ''
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstreamRes.body!.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const content = parsed?.choices?.[0]?.delta?.content
              if (content) {
                accumulated += content
                controller.enqueue(encoder.encode(content))
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        controller.close()
        if (accumulated) {
          cache.set(key, { text: accumulated, expiresAt: Date.now() + CACHE_TTL_MS })
        }
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
