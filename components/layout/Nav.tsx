'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Leaderboard' },
  { href: '/feed', label: 'Trade Feed' },
  { href: '/markets', label: 'Markets' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E8E8E8] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-[#0D0D0D] flex items-center justify-center">
              <span className="text-white text-[11px] font-bold tracking-tight">PT</span>
            </div>
            <span className="text-[15px] font-semibold text-[#0D0D0D] tracking-tight">
              Polytracker
            </span>
          </Link>

          {/* Nav links */}
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

          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00C805]" />
            <span className="text-[12px] text-[#8C8C8C] font-medium">Live</span>
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
