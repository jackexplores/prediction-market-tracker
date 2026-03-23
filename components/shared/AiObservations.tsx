'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

interface AiObservationsProps {
  page: 'leaderboard' | 'trades'
  filters: Record<string, string>
  dataSummary: string
}

function lsKey(page: string, filters: Record<string, string>) {
  return `ai-obs:${page}:${JSON.stringify(filters)}`
}

// Exported so it can be used as the `loading` fallback in dynamic()
export function AiObservationsSkeleton() {
  return (
    <div className="card overflow-hidden mb-6">
      <div className="px-6 py-3 border-b border-[#E8E8E8] bg-[#F7F7F7] flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide">AI Observations</span>
      </div>
      <div className="px-6 py-4 flex flex-col gap-3">
        <div className="skeleton h-[14px] w-full rounded" />
        <div className="skeleton h-[14px] w-5/6 rounded" />
        <div className="skeleton h-[14px] w-4/5 rounded" />
        <div className="skeleton h-[14px] w-full rounded" />
        <div className="skeleton h-[14px] w-3/4 rounded" />
      </div>
    </div>
  )
}

export function AiObservations({ page, filters, dataSummary }: AiObservationsProps) {
  const filtersKey = JSON.stringify(filters)
  const key = lsKey(page, filters)

  // Reads localStorage synchronously — safe because this component is always imported with ssr:false
  const [observation, setObservation] = useState<string>(() => {
    try { return localStorage.getItem(key) ?? '' } catch { return '' }
  })
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When filters change, immediately load cached content for the new key
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(lsKey(page, filters)) ?? ''
      setObservation(stored)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page])

  const fetchObservations = useCallback(async (summary: string, filtersObj: Record<string, string>, cacheKey: string) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setRefreshing(true)
    setError(null)

    let incoming = ''
    let replaced = false

    try {
      const res = await fetch('/api/ai-observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, filters: filtersObj, dataSummary: summary }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) { setError('Unable to generate observations'); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        incoming += chunk
        if (!replaced) {
          setObservation(chunk)
          replaced = true
        } else {
          setObservation(prev => prev + chunk)
        }
      }

      if (incoming) {
        try { localStorage.setItem(cacheKey, incoming) } catch { /* ignore */ }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError('Unable to generate observations')
    } finally {
      setRefreshing(false)
    }
  }, [page])

  useEffect(() => {
    if (!dataSummary.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchObservations(dataSummary, filters, key)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSummary, filtersKey, fetchObservations])

  useEffect(() => () => { abortRef.current?.abort() }, [])

  const hasContent = observation.trim().length > 0
  const showSkeleton = !hasContent && !error

  return (
    <div className="card overflow-hidden mb-6">
      {/* Header — matches leaderboard table header style */}
      <div className="px-6 py-3 border-b border-[#E8E8E8] bg-[#F7F7F7] flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#8C8C8C] uppercase tracking-wide">AI Observations</span>
        {refreshing && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#8C8C8C] animate-spin shrink-0">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" />
          </svg>
        )}
        {error && !refreshing && (
          <button
            onClick={() => fetchObservations(dataSummary, filters, key)}
            className="text-[11px] font-medium text-[#8C8C8C] hover:text-[#0D0D0D] transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-4 flex flex-col gap-3">
        {showSkeleton ? (
          <>
            <div className="skeleton h-[14px] w-full rounded" />
            <div className="skeleton h-[14px] w-5/6 rounded" />
            <div className="skeleton h-[14px] w-4/5 rounded" />
            <div className="skeleton h-[14px] w-full rounded" />
            <div className="skeleton h-[14px] w-3/4 rounded" />
          </>
        ) : (
          observation
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .map((line, i) => (
              <p key={i} className="text-[13px] text-[#0D0D0D] leading-relaxed">
                {line}
              </p>
            ))
        )}
      </div>
    </div>
  )
}
