import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServerClient()

    const isDirectFiche = body.nom !== undefined

    let ficheData: Record<string, unknown>

    if (isDirectFiche) {
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
        ingredients: body.ingredients || [],
        etapes: body.etapes || [],
        source_preparation: body.source_preparation || null,
      }
    } else {
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
        ficheData.preparations_libres = recipe.preparations_libres ||
          (recipe.ingredients?.length ? recipe.ingredients.map((i: Record<string, unknown>) => `${i.quantite || ''} ${i.unite || ''} ${i.nom || ''}`.trim()).join('\n') : null)
      } else if (type === 'produit') {
        ficheData.note_libre = recipe.note_libre || null
        ficheData.prix_min = recipe.prix_min || null
        ficheData.prix_max = recipe.prix_max || null
      }
    }

    const { error } = await supabase.from('fiches').insert(ficheData)
    if (error) throw new Error(error.message)

    // Revalidate all relevant pages so fiches appear immediately
    revalidatePath('/')
    revalidatePath('/plats/[categorie]')
    revalidatePath('/preparations/[categorie]')
    revalidatePath('/produits')

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}
