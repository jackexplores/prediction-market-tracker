import { AlertsClient } from '@/components/alerts/AlertsClient'
import { createClient } from '@/lib/supabase/server'

async function getTopTraders() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('traders')
      .select('id, username, wallet_address, rank_all, total_pnl')
      .not('rank_all', 'is', null)
      .order('rank_all', { ascending: true })
      .limit(50)
    return data ?? []
  } catch {
    return []
  }
}

export default async function AlertsPage() {
  const traders = await getTopTraders()

  return (
    <div>
      <div className="border-b border-[#E8E8E8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0D0D0D] tracking-tight mb-2">
            Trade Alerts
          </h1>
          <p className="text-[15px] text-[#8C8C8C] max-w-xl">
            Get notified when top traders make moves above your size threshold.
            Receive alerts via webhook (Discord/Telegram) or email.
          </p>
        </div>
      </div>

      <AlertsClient traders={traders} />
    </div>
  )
}
