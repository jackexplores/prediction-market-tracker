'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  traderId: string
  positive: boolean
}

export function Sparkline({ traderId, positive }: SparklineProps) {
  const [data, setData] = useState<{ v: number }[]>([])

  useEffect(() => {
    // Generate plausible-looking sparkline from trader ID seed
    const seed = traderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const points: { v: number }[] = []
    let v = 50
    for (let i = 0; i < 12; i++) {
      const noise = Math.sin((seed + i) * 2.4) * 15 + Math.cos((seed + i) * 1.7) * 10
      v = Math.max(0, Math.min(100, v + noise))
      points.push({ v })
    }
    // Bias last point toward positive/negative
    if (positive) {
      points[points.length - 1] = { v: Math.max(points[points.length - 1].v, 60) }
    } else {
      points[points.length - 1] = { v: Math.min(points[points.length - 1].v, 40) }
    }
    setData(points)
  }, [traderId, positive])

  if (data.length === 0) return <div className="skeleton w-20 h-8" />

  return (
    <div className="sparkline-container w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? '#00C805' : '#FF5000'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
