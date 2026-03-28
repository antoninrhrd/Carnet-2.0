import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const VALID_TYPES = ['plat', 'preparation']
const VALID_PLAT_CATS = ['entrees', 'entrees-vege', 'plats-vege', 'plats-viande', 'plats-poisson', 'desserts']
const VALID_PREP_CATS = ['pates', 'pasta', 'sauces', 'condiments', 'sucre', 'autre']

function sanitizeFiche(f: Record<string, unknown>) {
  const type = VALID_TYPES.includes(f.type as string) ? f.type as string : 'preparation'
  const validCats = type === 'plat' ? VALID_PLAT_CATS : VALID_PREP_CATS
  const categorie = validCats.includes(f.categorie as string) ? f.categorie as string : (type === 'plat' ? 'entrees' : 'autre')
  return {
    type,
    categorie,
    nom: (f.nom as string) || (f.name as string) || 'Sans nom',
    source: f.source || null,
    dressage: f.dressage || null,
    saison: f.saison || null,
    note_perso: f.note_perso || null,
    ingredients: Array.isArray(f.ingredients) ? f.ingredients : [],
    etapes: Array.isArray(f.etapes) ? f.etapes : [],
    preparations_libres: f.preparations_libres || null,
    source_preparation: f.source_preparation || f.source || null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Clé API Anthropic manquante — ajoutez ANTHROPIC_API_KEY dans les variables Vercel.' }, { status: 500 })
    }

    const { images } = await req.json()

    const prompt = `Tu es un assistant culinaire expert. Analyse ces photos de fiches techniques de cuisine.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte, sans aucun texte avant ou après :
{
  "fiches": [
    {
      "type": "plat" ou "preparation",
      "categorie": pour plat: "entrees" ou "entrees-vege" ou "plats-vege" ou "plats-viande" ou "plats-poisson" ou "desserts", pour preparation: "pates" ou "pasta" ou "sauces" ou "condiments" ou "sucre" ou "autre",
      "nom": "Nom exact visible sur la photo",
      "source": "Chef ou restaurant source ou null",
      "dressage": "Instructions de dressage ou null",
      "saison": null,
      "note_perso": "Remarques ou null",
      "ingredients": [{"id": "1", "quantite": "200", "unite": "g", "nom": "Beurre"}],
      "etapes": ["Étape 1 complète", "Étape 2 complète"],
      "preparations_libres": "Composants du plat ou null"
    }
  ]
}`

    const content: Array<{type: string; source?: {type: string; media_type: string; data: string}; text?: string}> = []
    for (const img of images) {
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
    }
    content.push({ type: 'text', text: prompt })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ ok: false, error: `Erreur API: ${response.status} — ${errText.slice(0, 300)}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    if (!text) {
      return NextResponse.json({ ok: false, error: 'Réponse vide de Claude' }, { status: 500 })
    }

    let parsed: { fiches?: unknown[] } = {}
    try { parsed = JSON.parse(text) }
    catch {
      try {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
      } catch {
        try {
          const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          parsed = JSON.parse(clean)
        } catch {
          return NextResponse.json({ ok: false, error: 'Photo illisible. Réessayez avec une image plus nette.' }, { status: 500 })
        }
      }
    }

    let rawFiches: unknown[] = []
    if (Array.isArray(parsed)) rawFiches = parsed
    else if (Array.isArray(parsed?.fiches)) rawFiches = parsed.fiches
    else if (parsed && typeof parsed === 'object') rawFiches = [parsed]

    if (rawFiches.length === 0) {
      return NextResponse.json({ ok: false, error: 'Aucune fiche détectée. Essayez avec une image plus lisible.' }, { status: 400 })
    }

    const fiches = rawFiches.map(f => sanitizeFiche(f as Record<string, unknown>))
    return NextResponse.json({ ok: true, fiches })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
