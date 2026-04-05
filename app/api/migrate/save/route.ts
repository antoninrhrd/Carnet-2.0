import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServerClient()

    // Import depuis photo : body contient directement les champs de la fiche
    const isDirectFiche = body.nom !== undefined

    let ficheData: Record<string, unknown>

    if (isDirectFiche) {
      // On sauvegarde TOUT ce que Claude a détecté, sans rien filtrer selon le type
      ficheData = {
        type:                 body.type,
        categorie:            body.categorie,
        nom:                  body.nom || 'Sans nom',
        image_url:            null,
        source:               body.source || null,
        dressage:             body.dressage || null,
        saison:               body.saison || null,
        note_perso:           body.note_perso || null,
        preparations_libres:  body.preparations_libres || null,
        ingredients:          Array.isArray(body.ingredients) ? body.ingredients : [],
        etapes:               Array.isArray(body.etapes) ? body.etapes : [],
        source_preparation:   body.source_preparation || null,
        allergenes:           Array.isArray(body.allergenes) ? body.allergenes : [],
      }
    } else {
      // Format migration legacy (recipe wrapper)
      const { recipe, type, categorie } = body
      const nom = recipe.name || recipe.nom || 'Sans nom'
      ficheData = {
        type, categorie, nom,
        image_url:   recipe.imageUrl || null,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map((ing: Record<string, unknown>, i: number) => ({ id: `m_${i}`, quantite: ing.quantite || '', unite: ing.unite || '', nom: ing.nom || '' })) : [],
        etapes:      recipe.steps || recipe.etapes || [],
        saison:      recipe.saison || null,
        note_perso:  recipe.note_perso || null,
        source:      recipe.source || null,
        dressage:    recipe.dressage || null,
        preparations_libres: recipe.preparations_libres || null,
        source_preparation:  recipe.source_preparation || null,
        allergenes:  Array.isArray(recipe.allergenes) ? recipe.allergenes : [],
      }
    }

    const { error } = await supabase.from('fiches').insert(ficheData)
    if (error) throw new Error(error.message)

    revalidatePath('/', 'layout')
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
