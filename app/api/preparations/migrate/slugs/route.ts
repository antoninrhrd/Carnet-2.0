import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const BASE = 'https://antonin-sigma.vercel.app'

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#039;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
}

function mapCategory(name: string, cat: string): { type: string; categorie: string } {
  const n = name.toLowerCase()
  if (n.includes('fiche produit')) return { type: 'produit', categorie: 'produits' }

  const c = cat.toLowerCase()
  if (c.includes('sauce')) return { type: 'preparation', categorie: 'sauces' }
  if (c.includes('pâte') || c.includes('pate')) return { type: 'preparation', categorie: 'pates' }
  if (c.includes('pasta')) return { type: 'preparation', categorie: 'pasta' }
  if (c.includes('condiment')) return { type: 'preparation', categorie: 'condiments' }
  if (c.includes('garniture') || c.includes('accompagnement') || c.includes('boisson') ||
      c.includes('preparation') || c.includes('préparation')) {
    return { type: 'preparation', categorie: 'autre' }
  }
  if (c.includes('entrée') || c.includes('entree') || c.includes('amuse')) {
    return { type: 'plat', categorie: 'entrees' }
  }
  if (c.includes('dessert')) return { type: 'plat', categorie: 'desserts' }
  if (c.includes('plat')) return { type: 'plat', categorie: 'plats-viande' }
  return { type: 'preparation', categorie: 'autre' }
}

function parseRecipeHtml(html: string, slug: string) {
  // Name
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name = h1 ? stripTags(h1[1]) : slug.replace(/-/g, ' ')

  // Image — skip navigation icons
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
  let imgMatch: RegExpExecArray | null
  let imageUrl: string | null = null
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1]
    if (src.startsWith('http') && !src.includes('/assets/')) {
      imageUrl = src
      break
    }
  }

  // Steps — look for <ol> items
  const stepsHtml = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i)
  const steps: string[] = []
  if (stepsHtml) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let li: RegExpExecArray | null
    while ((li = liRegex.exec(stepsHtml[1])) !== null) {
      const text = stripTags(li[1]).replace(/^[ÉE]tape\s*\d+\s*/i, '').trim()
      if (text) steps.push(text)
    }
  }

  // Metadata + ingredients: find all <ul> blocks
  const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi
  const allUls: string[][] = []
  let ulMatch: RegExpExecArray | null
  while ((ulMatch = ulRegex.exec(html)) !== null) {
    const liItems: string[] = []
    const liR = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let liM: RegExpExecArray | null
    while ((liM = liR.exec(ulMatch[1])) !== null) {
      const t = stripTags(liM[1]).trim()
      if (t) liItems.push(t)
    }
    if (liItems.length) allUls.push(liItems)
  }

  // Find metadata ul (has a time item)
  const DIFF = ['facile', 'moyenne', 'difficile', 'moyen', 'easy', 'hard']
  const KNOWN_CATS = ['sauce', 'pâte', 'pasta', 'condiment', 'préparation', 'preparation',
    'garniture', 'accompagnement', 'boisson', 'entrée', 'entree', 'dessert', 'plat',
    'amuse bouche', 'amuse', 'bouche']

  let category = 'Préparation'
  let ingredients: string[] = []

  for (const ul of allUls) {
    const hasTime = ul.some(i => /\d+\s*(min|h)/i.test(i))
    if (hasTime) {
      // This is the metadata ul
      for (const item of ul) {
        const lower = item.toLowerCase()
        if (/\d+\s*(min|h)/i.test(lower)) continue
        if (lower.includes('personne') || /^\d+$/.test(lower.trim())) continue
        if (DIFF.some(d => lower === d)) continue
        if (KNOWN_CATS.some(c => lower.includes(c))) {
          category = item
          break
        }
      }
    } else {
      // Check if this could be the ingredients list (comes after steps)
      // Use the last non-nav ul as ingredients
      const isNav = ul.some(i => i.toLowerCase().includes('toutes les recettes') ||
        i.toLowerCase().includes('nouvelle recette'))
      if (!isNav && ul.length > 0) {
        ingredients = ul
      }
    }
  }

  return { name, imageUrl, steps, category, ingredients }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const supabase = createServerClient()

  // Check if already migrated
  const { data: existing } = await supabase
    .from('fiches')
    .select('id')
    .eq('nom', decodeURIComponent(slug).replace(/-/g, ' '))
    .limit(1)

  try {
    const res = await fetch(`${BASE}/recettes/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()
    const recipe = parseRecipeHtml(html, slug)
    const { type, categorie } = mapCategory(recipe.name, recipe.category)

    const ficheData: Record<string, unknown> = {
      type,
      categorie,
      nom: recipe.name,
      image_url: recipe.imageUrl,
    }

    if (type === 'preparation') {
      ficheData.ingredients = recipe.ingredients.map((nom, i) => ({
        id: `m_${i}`,
        quantite: '',
        unite: '',
        nom,
      }))
      ficheData.etapes = recipe.steps
    } else if (type === 'plat') {
      ficheData.dressage = recipe.steps.join('\n\n') || null
      ficheData.note_perso = recipe.ingredients.length
        ? 'Ingrédients : ' + recipe.ingredients.join(', ')
        : null
    } else if (type === 'produit') {
      const parts = [
        recipe.steps.join('\n'),
        recipe.ingredients.length ? 'Ingrédients : ' + recipe.ingredients.join(', ') : '',
      ].filter(Boolean)
      ficheData.note_libre = parts.join('\n\n') || null
    }

    const { error } = await supabase.from('fiches').insert(ficheData)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, name: recipe.name, type, categorie })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, slug, error: message })
  }
}
