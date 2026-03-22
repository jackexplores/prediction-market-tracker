import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { trader_id, channel, endpoint, min_size_usd, category_filter, cooldown_mins, user_email } = body

  if (!trader_id || !channel || !endpoint) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['webhook', 'email'].includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('alert_subscriptions')
    .insert({
      trader_id,
      channel,
      endpoint,
      min_size_usd: min_size_usd ?? 0,
      category_filter: category_filter ?? null,
      cooldown_mins: cooldown_mins ?? 60,
      user_email: user_email ?? null,
      active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscription: data })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const trader_id = searchParams.get('trader_id')

  const supabase = await createClient()

  let query = supabase.from('alert_subscriptions').select('*, traders(username, wallet_address)')

  if (trader_id) {
    query = query.eq('trader_id', trader_id)
  }

  const { data, error } = await query.eq('active', true).limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscriptions: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()

  const { error } = await supabase
    .from('alert_subscriptions')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
