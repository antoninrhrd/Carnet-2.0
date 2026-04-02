import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    const supabase = createServerClient()

    const { data: original, error } = await supabase.from('fiches').select('*').eq('id', id).single()
    if (error || !original) return NextResponse.json({ ok: false, error: 'Fiche introuvable' })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at, updated_at, ...rest } = original
    const copy = { ...rest, nom: `${original.nom} (copie)` }

    const { data: newFiche, error: insertError } = await supabase.from('fiches').insert(copy).select().single()
    if (insertError) return NextResponse.json({ ok: false, error: insertError.message })

    return NextResponse.json({ ok: true, id: newFiche.id })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Erreur' })
  }
}
