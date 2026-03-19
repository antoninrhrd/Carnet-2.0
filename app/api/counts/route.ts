import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('fiches')
    .select('type, categorie')

  const counts: Record<string, number> = {}
  for (const row of (data || [])) {
    const key = `${row.type}_${row.categorie}`
    counts[key] = (counts[key] || 0) + 1
  }

  return NextResponse.json(counts)
}
