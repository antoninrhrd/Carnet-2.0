import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()

    const prompt = `Tu es un assistant culinaire expert. Analyse ces photos de fiches techniques de cuisine et extrait toutes les informations pour créer des fiches structurées.

Pour chaque préparation ou plat visible sur les photos, retourne un objet JSON avec cette structure EXACTE :

{
  "fiches": [
    {
      "type": "plat" ou "preparation",
      "categorie": une des valeurs suivantes:
        Pour type "plat": "entrees", "entrees-vege", "plats-vege", "plats-viande", "plats-poisson", "desserts"
        Pour type "preparation": "pates", "pasta", "sauces", "condiments", "sucre", "autre",
      "nom": "Nom du plat ou de la préparation",
      "source": "Source ou inspiration si mentionnée (plat uniquement, sinon null)",
      "dressage": "Instructions de dressage si présentes (plat uniquement, sinon null)",
      "saison": "Printemps" ou "Été" ou "Automne" ou "Hiver" ou "Toute saison" ou null,
      "note_perso": "Autres notes ou remarques ou null",
      "ingredients": [
        { "id": "1", "quantite": "200", "unite": "g", "nom": "Beurre doux" }
      ],
      "etapes": ["Étape 1...", "Étape 2..."],
      "preparations_libres": "Liste des éléments qui composent ce plat (plat uniquement, sinon null)"
    }
  ]
}

Règles importantes :
- Si la fiche contient un plat principal avec plusieurs sous-préparations, crée UNE fiche plat ET autant de fiches préparation que nécessaire
- Pour un plat, mets les éléments dans "preparations_libres" et crée des fiches séparées pour chaque préparation détaillée
- Pour une préparation, remplis "ingredients" et "etapes"
- Si tu ne vois pas d'information pour un champ, mets null
- Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après, sans balises markdown`

    const content: Array<{type: string; source?: {type: string; media_type: string; data: string}; text?: string}> = []
    
    for (const img of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType,
          data: img.data,
        }
      })
    }
    
    content.push({ type: 'text', text: prompt })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Try multiple JSON extraction strategies
    let parsed: { fiches?: unknown[] } = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      try {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
      } catch {
        try {
          const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          parsed = JSON.parse(clean)
        } catch {
          return NextResponse.json({ ok: false, error: `Impossible d'analyser la réponse. Réessayez avec une photo plus nette.` }, { status: 500 })
        }
      }
    }

    // Handle different possible response structures
    let fiches: unknown[] = []
    if (Array.isArray(parsed)) {
      fiches = parsed
    } else if (Array.isArray(parsed?.fiches)) {
      fiches = parsed.fiches
    } else if (parsed && typeof parsed === 'object') {
      fiches = [parsed]
    }

    if (fiches.length === 0) {
      return NextResponse.json({ ok: false, error: 'Aucune fiche détectée dans la photo. Essayez avec une image plus lisible.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, fiches })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
