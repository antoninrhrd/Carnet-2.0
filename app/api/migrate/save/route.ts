import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { recipe, type, categorie, extra } = await req.json()
    const supabase = createServerClient()

    // Support both "name" (migration) and "nom" (import photo)
    const nom = recipe.name || recipe.nom || 'Sans nom'

    const ficheData: Record<string, unknown> = {
      type,
      categorie,
      nom,
      image_url: recipe.imageUrl || null,
    }

    if (type === 'preparation') {
      ficheData.ingredients = (recipe.ingredients || []).map((ing: {nom?: string; quantite?: string; unite?: string}, i: number) => ({
        id: `m_${i}`, quantite: ing.quantite || '', unite: ing.unite || '', nom: ing.nom || '',
      }))
      ficheData.etapes = recipe.steps || recipe.etapes || []
      ficheData.saison = extra?.saison || recipe.saison || null
      ficheData.note_perso = extra?.note_perso || recipe.note_perso || null
      ficheData.source_preparation = extra?.source || recipe.source || null
    } else if (type === 'plat') {
      ficheData.dressage = extra?.dressage || recipe.dressage || (recipe.steps?.join('\n\n')) || null
      ficheData.note_perso = extra?.note_perso || recipe.note_perso || null
      ficheData.saison = extra?.saison || recipe.saison || null
      ficheData.source = extra?.source || recipe.source || null
      ficheData.preparations_libres = extra?.preparations_libres || recipe.preparations_libres || null
      // ingredients as note if any
      if (!ficheData.preparations_libres && recipe.ingredients?.length) {
        ficheData.preparations_libres = recipe.ingredients.map((i: {nom?: string; quantite?: string; unite?: string}) => `${i.quantite || ''} ${i.unite || ''} ${i.nom || ''}`.trim()).join('\n')
      }
    } else if (type === 'produit') {
      ficheData.note_libre = recipe.note_libre || null
      ficheData.prix_min = recipe.prix_min || null
      ficheData.prix_max = recipe.prix_max || null
    }

    const { error } = await supabase.from('fiches').insert(ficheData)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}
