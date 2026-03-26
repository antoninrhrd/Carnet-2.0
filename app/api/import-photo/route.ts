import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json()

    const prompt = `Tu es un assistant culinaire expert. Analyse ces photos de fiches techniques de cuisine et extrait toutes les informations pour créer des fiches structurées.

Pour chaque préparation ou plat visible sur les photos, retourne un objet JSON avec cette structure EXACTE :

{
  "fiches": [
    {
      "type": "plat" | "preparation",
      "categorie": une des valeurs suivantes selon le contenu:
        Pour type "plat": "entrees", "entrees-vege", "plats-vege", "plats-viande", "plats-poisson", "desserts"
        Pour type "preparation": "pates", "pasta", "sauces", "condiments", "sucre", "autre",
      "nom": "Nom du plat ou de la préparation",
      "source": "Source ou inspiration si mentionnée (plat uniquement)",
      "dressage": "Instructions de dressage si présentes (plat uniquement)",
      "saison": "Printemps" | "Été" | "Automne" | "Hiver" | "Toute saison" | null,
      "note_perso": "Autres notes ou remarques",
      "ingredients": [
        { "id": "1", "quantite": "200", "unite": "g", "nom": "Beurre doux" }
      ],
      "etapes": ["Étape 1...", "Étape 2..."],
      "preparations_libres": "Liste des éléments/préparations qui composent ce plat (plat uniquement)"
    }
  ]
}

Règles importantes :
- Si la fiche contient un plat principal avec plusieurs sous-préparations, crée UNE fiche plat ET autant de fiches préparation que nécessaire
- Pour un plat, mets les ingrédients globaux dans "preparations_libres" et crée des fiches séparées pour chaque préparation détaillée
- Pour une préparation, remplis "ingredients" et "etapes"
- Si tu ne vois pas d'information pour un champ, mets null
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après, sans balises markdown`

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
    
    // Clean and parse JSON
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ ok: true, fiches: parsed.fiches })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
