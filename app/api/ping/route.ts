import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerClient()
    await supabase.from('fiches').select('id').limit(1)
    return NextResponse.json({ ok: true, pinged: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
