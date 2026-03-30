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
    let type: string
    let categorie: string

    if (isDirectFiche) {
      type = body.type
      categorie = body.categorie
      ficheData = {
        type,
        categorie,
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
      const { recipe } = body
      type = body.type
      categorie = body.categorie
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
      } else if (type === 'produit') {
        ficheData.note_libre = recipe.note_libre || null
        ficheData.prix_min = recipe.prix_min || null
        ficheData.prix_max = recipe.prix_max || null
      }
    }

    const { error } = await supabase.from('fiches').insert(ficheData)
    if (error) throw new Error(error.message)

    // Revalidate all pages that show fiches
    revalidatePath('/', 'page')
    revalidatePath('/plats/entrees', 'page')
    revalidatePath('/plats/entrees-vege', 'page')
    revalidatePath('/plats/plats-vege', 'page')
    revalidatePath('/plats/plats-viande', 'page')
    revalidatePath('/plats/plats-poisson', 'page')
    revalidatePath('/plats/desserts', 'page')
    revalidatePath('/preparations/pates', 'page')
    revalidatePath('/preparations/pasta', 'page')
    revalidatePath('/preparations/sauces', 'page')
    revalidatePath('/preparations/condiments', 'page')
    revalidatePath('/preparations/sucre', 'page')
    revalidatePath('/preparations/autre', 'page')
    revalidatePath('/produits', 'page')

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}
