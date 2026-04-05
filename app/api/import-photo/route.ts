import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const VALID_TYPES = ['plat', 'preparation']
const VALID_PLAT_CATS = ['entrees', 'entrees-vege', 'plats-vege', 'plats-viande', 'plats-poisson', 'plats-crustace', 'plats-mollusque', 'desserts']
const VALID_PREP_CATS = ['pates', 'pasta', 'sauces', 'condiments', 'sucre', 'autre']
const VALID_ALLERGENES = ['gluten', 'lactose', 'oeufs', 'poisson', 'crustaces', 'mollusques', 'arachides', 'fruits-a-coque', 'soja', 'celeri', 'moutarde', 'sesame', 'sulfites', 'lupin', 'vegan']

function sanitizeFiche(f: Record<string, unknown>) {
  const type = VALID_TYPES.includes(f.type as string) ? f.type as string : 'preparation'
  const validCats = type === 'plat' ? VALID_PLAT_CATS : VALID_PREP_CATS
  const categorie = validCats.includes(f.categorie as string) ? f.categorie as string : (type === 'plat' ? 'entrees' : 'autre')
  const rawAllergenes = Array.isArray(f.allergenes) ? f.allergenes : []
  const allergenes = rawAllergenes.filter((a: unknown) => VALID_ALLERGENES.includes(a as string))

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
    allergenes,
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Clé API Anthropic manquante.' }, { status: 500 })
    }

    const { images } = await req.json()

    const prompt = `Tu es un assistant culinaire expert. Analyse ces photos de fiches techniques de cuisine.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte, sans aucun texte avant ou après :
{
  "fiches": [
    {
      "type": "plat" ou "preparation",
      "categorie": pour plat: "entrees"/"entrees-vege"/"plats-vege"/"plats-viande"/"plats-poisson"/"plats-crustace"/"plats-mollusque"/"desserts", pour preparation: "pates"/"pasta"/"sauces"/"condiments"/"sucre"/"autre",
      "nom": "Nom exact visible sur la photo",
      "source": "Chef ou livre source ou null",
      "dressage": "Instructions de dressage ou null",
      "saison": null,
      "note_perso": "Remarques ou null",
      "ingredients": [{"id": "1", "quantite": "200", "unite": "g", "nom": "Beurre"}],
      "etapes": ["Étape 1 complète", "Étape 2 complète"],
      "preparations_libres": "Liste des composants du plat ou null",
      "allergenes": ["gluten", "lactose"]
    }
  ]
}

RÈGLES :
- "type" doit être exactement "plat" ou "preparation"
- "nom" doit être le nom visible sur la photo
- Retranscris TOUJOURS tous les ingrédients avec quantités ET toutes les étapes, même pour un plat
- Pour "allergenes" : détecte les allergènes présents dans les ingrédients et retourne uniquement les slugs applicables parmi cette liste exacte : "gluten", "lactose", "oeufs", "poisson", "crustaces", "mollusques", "arachides", "fruits-a-coque", "soja", "celeri", "moutarde", "sesame", "sulfites", "lupin", "vegan". Si aucun allergène détecté ou incertain, retourne []
- Si plusieurs préparations distinctes sont visibles, crée plusieurs objets dans "fiches"
- Réponds UNIQUEMENT avec le JSON, rien d'autre`

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
    if (!text) return NextResponse.json({ ok: false, error: 'Réponse vide.' }, { status: 500 })

    let parsed: { fiches?: unknown[] } = {}
    try { parsed = JSON.parse(text) }
    catch {
      try {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
      } catch {
        try {
          parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
        } catch {
          return NextResponse.json({ ok: false, error: 'Photo illisible. Essayez avec une image plus nette.' }, { status: 500 })
        }
      }
    }

    let rawFiches: unknown[] = []
    if (Array.isArray(parsed)) rawFiches = parsed
    else if (Array.isArray(parsed?.fiches)) rawFiches = parsed.fiches
    else if (parsed && typeof parsed === 'object') rawFiches = [parsed]

    if (rawFiches.length === 0) {
      return NextResponse.json({ ok: false, error: 'Aucune fiche détectée.' }, { status: 400 })
    }

    const fiches = rawFiches.map(f => sanitizeFiche(f as Record<string, unknown>))
    return NextResponse.json({ ok: true, fiches })

  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 })
  }
}
