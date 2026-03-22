'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: Record<string, { volume: number; count: number }>
}

const COLORS = ['#0D0D0D', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB']

export function CategoryChart({ data }: Props) {
  const entries = Object.entries(data)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.volume - a.volume)

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-[#8C8C8C]">
        No category data yet
      </div>
    )
  }

  const total = entries.reduce((s, e) => s + e.volume, 0)

  return (
    <div>
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={entries} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#8C8C8C' }}
            width={65}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value ?? 0), true), 'Volume']}
            contentStyle={{
              border: '1px solid #E8E8E8',
              borderRadius: 8,
              fontSize: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          />
          <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
            {entries.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-col gap-1.5">
        {entries.map((e, i) => (
          <div key={e.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-[#0D0D0D] font-medium">{e.name}</span>
            </div>
            <div className="flex items-center gap-3 text-[#8C8C8C]">
              <span>{e.count} trades</span>
              <span className="font-semibold text-[#0D0D0D]">
                {total > 0 ? Math.round((e.volume / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
