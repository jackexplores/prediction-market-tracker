'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Leaderboard' },
  { href: '/feed', label: 'Trade Feed' },
  { href: '/markets', label: 'Markets' },
]

function ChartPolarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.75" fill="currentColor"/>
      <line x1="12" y1="3" x2="12" y2="10.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="20.196" y1="7.5" x2="14.04" y2="10.04" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="20.196" y1="16.5" x2="14.04" y2="13.96" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="21" x2="12" y2="13.75" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3.804" y1="16.5" x2="9.96" y2="13.96" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3.804" y1="7.5" x2="9.96" y2="10.04" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E8E8] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {/* Logo + nav links on left */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <ChartPolarIcon className="w-5 h-5 text-[#0D0D0D]" />
              <span className="text-[15px] font-semibold text-[#0D0D0D] tracking-tight">
                Prediction Market Tracker
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {links.map(({ href, label }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors',
                      active
                        ? 'bg-[#F7F7F7] text-[#0D0D0D]'
                        : 'text-[#8C8C8C] hover:text-[#0D0D0D] hover:bg-[#F7F7F7]'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Live indicator */}
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FFF0] border border-[#00C805]/20">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00C805] shrink-0" />
            <span className="text-[11px] font-semibold text-[#00C805]">LIVE</span>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-2 overflow-x-auto">
          {links.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-[#0D0D0D] text-white'
                    : 'text-[#8C8C8C] border border-[#E8E8E8]'
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
