import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { recipe, type, categorie } = await req.json()
    const supabase = createServerClient()

    const ficheData: Record<string, unknown> = {
      type,
      categorie,
      nom: recipe.name,
      image_url: recipe.imageUrl,
    }

    if (type === 'preparation') {
      ficheData.ingredients = (recipe.ingredients || []).map((nom: string, i: number) => ({
        id: `m_${i}`, quantite: '', unite: '', nom,
      }))
      ficheData.etapes = recipe.steps || []
    } else if (type === 'plat') {
      ficheData.dressage = recipe.steps?.join('\n\n') || null
      ficheData.note_perso = recipe.ingredients?.length
        ? 'Ingrédients : ' + recipe.ingredients.join(', ')
        : null
    } else if (type === 'produit') {
      const parts = [
        (recipe.steps || []).join('\n'),
        recipe.ingredients?.length ? 'Ingrédients : ' + recipe.ingredients.join(', ') : '',
      ].filter(Boolean)
      ficheData.note_libre = parts.join('\n\n') || null
    }

    const { error } = await supabase.from('fiches').insert(ficheData)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}

