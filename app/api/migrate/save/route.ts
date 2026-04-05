import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServerClient()

    const isDirectFiche = body.nom !== undefined

    let ficheData: Record<string, unknown>

    if (isDirectFiche) {
      // Import depuis photo — on conserve TOUT ce que Claude a détecté
      ficheData = {
        type: body.type,
        categorie: body.categorie,
        nom: body.nom || 'Sans nom',
        image_url: null,
        source: body.source || null,
        dressage: body.dressage || null,
        saison: body.saison || null,
        note_perso: body.note_perso || null,
        preparations_libres: body.preparations_libres || null,
        // Toujours sauvegarder ingrédients et étapes, même pour un plat
        ingredients: body.ingredients || [],
        etapes: body.etapes || [],
        source_preparation: body.source_preparation || null,
      }
    } else {
      // Format migration legacy
      const { recipe, type, categorie } = body
      const nom = recipe.name || recipe.nom || 'Sans nom'
      ficheData = { type, categorie, nom, image_url: recipe.imageUrl || null }

      if (type === 'preparation') {
        ficheData.ingredients = (recipe.ingredients || []).map((ing: Record<string, unknown>, i: number) => ({
          id: `m_${i}`, quantite: ing.quantite || '', unite: ing.unite || '', nom: ing.nom || '',
        }))
        ficheData.etapes = recipe.steps || recipe.etapes || []
        ficheData.saison = recipe.saison || null
        ficheData.note_perso = recipe.note_perso || null
        ficheData.source_preparation = recipe.source || null
      } else if (type === 'plat') {
        ficheData.dressage = recipe.dressage || (recipe.steps?.join('\n\n')) || null
        ficheData.note_perso = recipe.note_perso || null
        ficheData.saison = recipe.saison || null
        ficheData.source = recipe.source || null
        ficheData.preparations_libres = recipe.preparations_libres || null
        ficheData.ingredients = recipe.ingredients || []
        ficheData.etapes = recipe.etapes || []
      } else if (type === 'produit') {
        ficheData.note_libre = recipe.note_libre || null
        ficheData.prix_min = recipe.prix_min || null
        ficheData.prix_max = recipe.prix_max || null
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
