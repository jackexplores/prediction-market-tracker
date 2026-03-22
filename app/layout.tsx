import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/layout/Nav'

export const metadata: Metadata = {
  title: 'Polytracker — Smart Money on Prediction Markets',
  description:
    'Track the best-performing Polymarket traders. Real-time trade feed, ranked leaderboard, and cross-platform Kalshi comparison.',
  openGraph: {
    title: 'Polytracker',
    description: 'Track smart money on prediction markets',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#E8E8E8] py-6 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[13px] text-[#8C8C8C]">
              Polytracker — publicly available data only. Not financial advice.
            </span>
            <span className="text-[13px] text-[#8C8C8C]">
              Past performance does not predict future results.
            </span>
          </div>
        </footer>
      </body>
    </html>
  )
}
