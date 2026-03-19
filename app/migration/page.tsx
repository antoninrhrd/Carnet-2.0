'use client'

import { useState } from 'react'
import Link from 'next/link'

const BASE = 'https://antonin-sigma.vercel.app'

interface Result {
  slug: string
  name?: string
  type?: string
  categorie?: string
  error?: string
}

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
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const name = h1 ? stripTags(h1[1]) : decodeURIComponent(slug).replace(/-/g, ' ')

  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi
  let imgMatch: RegExpExecArray | null
  let imageUrl: string | null = null
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1]
    if (src.startsWith('http') && !src.includes('/assets/')) {
      imageUrl = src; break
    }
  }

  const stepsHtml = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i)
  const steps: string[] = []
  if (stepsHtml) {
    const liR = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let li: RegExpExecArray | null
    while ((li = liR.exec(stepsHtml[1])) !== null) {
      const t = stripTags(li[1]).replace(/^[ÉE]tape\s*\d+\s*/i, '').trim()
      if (t) steps.push(t)
    }
  }

  const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi
  const allUls: string[][] = []
  let ulMatch: RegExpExecArray | null
  while ((ulMatch = ulRegex.exec(html)) !== null) {
    const items: string[] = []
    const liR = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let liM: RegExpExecArray | null
    while ((liM = liR.exec(ulMatch[1])) !== null) {
      const t = stripTags(liM[1]).trim()
      if (t) items.push(t)
    }
    if (items.length) allUls.push(items)
  }

  const KNOWN_CATS = ['sauce', 'pâte', 'pasta', 'condiment', 'préparation', 'preparation',
    'garniture', 'accompagnement', 'boisson', 'entrée', 'entree', 'dessert', 'plat', 'amuse']
  let category = 'Préparation'
  let ingredients: string[] = []

  for (const ul of allUls) {
    const isNav = ul.some(i => i.toLowerCase().includes('toutes les recettes') || i.toLowerCase().includes('nouvelle'))
    if (isNav) continue
    const hasTime = ul.some(i => /\d+\s*(min|h)/i.test(i))
    if (hasTime) {
      for (const item of ul) {
        const lower = item.toLowerCase()
        if (KNOWN_CATS.some(c => lower.includes(c))) { category = item; break }
      }
    } else {
      ingredients = ul
    }
  }

  return { name, imageUrl, steps, category, ingredients }
}

export default function MigrationPage() {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'done'>('idle')
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)
  const [current, setCurrent] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [errors, setErrors] = useState<Result[]>([])

  async function startMigration() {
    setStatus('migrating')
    setDone(0)
    setResults([])
    setErrors([])

    // 1. Fetch all slugs from old app
    let slugs: string[] = []
    try {
      const res = await fetch(`${BASE}/recettes`)
      const html = await res.text()
      const linkRegex = /href="\/recettes\/([^"]+)"/g
      const seen = new Set<string>()
      let m: RegExpExecArray | null
      while ((m = linkRegex.exec(html)) !== null) {
        const s = m[1]
        if (s !== 'new' && !s.includes('/modifier') && !seen.has(s)) {
          slugs.push(s); seen.add(s)
        }
      }
    } catch {
      alert("Impossible de contacter l'ancienne app. Vérifie ta connexion.")
      setStatus('idle'); return
    }

    if (slugs.length === 0) {
      alert("Aucune fiche trouvée. L'ancienne app est peut-être inaccessible.")
      setStatus('idle'); return
    }

    setTotal(slugs.length)

    // 2. Import each recipe via server API
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]
      setCurrent(decodeURIComponent(slug))
      setDone(i)

      try {
        const res = await fetch(`${BASE}/recettes/${slug}`)
        const html = await res.text()
        const recipe = parseRecipeHtml(html, slug)
        const { type, categorie } = mapCategory(recipe.name, recipe.category)

        // Send to our API to save in Supabase
        const saveRes = await fetch('/api/migrate/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe, type, categorie })
        })
        const data = await saveRes.json()

        if (data.ok) {
          setResults(prev => [...prev, { slug, name: recipe.name, type, categorie }])
        } else {
          setErrors(prev => [...prev, { slug, name: recipe.name, error: data.error }])
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erreur inconnue'
        setErrors(prev => [...prev, { slug, error: msg }])
      }

      await new Promise(r => setTimeout(r, 300))
    }

    setDone(slugs.length)
    setCurrent('')
    setStatus('done')
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div style={{ maxWidth: 700 }}>
      <Link href="/plats/entrees" className="detail-back">← Retour à l&apos;app</Link>
      <h1 className="form-title" style={{ marginBottom: 8 }}>Migration Sigma → Mes Fiches</h1>
      <p className="form-subtitle" style={{ marginBottom: 28 }}>
        Importe automatiquement toutes tes fiches depuis ton ancienne app. À ne lancer qu&apos;une seule fois.
      </p>

      {status === 'idle' && (
        <div className="form-section">
          <h2 className="form-section-title">Prêt à démarrer</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
            L&apos;outil va récupérer toutes tes fiches depuis <strong>antonin-sigma.vercel.app</strong> et les importer.
            Ça prend environ <strong>3-4 minutes</strong>.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            ⚠️ Ne ferme pas cette page pendant la migration.
          </p>
          <button className="btn-primary" onClick={startMigration} style={{ fontSize: 15, padding: '11px 24px' }}>
            ▶ Lancer la migration
          </button>
        </div>
      )}

      {status === 'migrating' && (
        <div className="form-section">
          <h2 className="form-section-title">Migration en cours…</h2>
          {total > 0 && (
            <>
              <div style={{ background: 'var(--border)', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 8, transition: 'width 0.3s ease' }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <strong>{done}</strong> / {total} fiches importées ({pct}%)
              </p>
            </>
          )}
          {!total && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Récupération de la liste…</p>}
          {current && <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>En cours : {current}</p>}
        </div>
      )}

      {status === 'done' && (
        <div className="form-section">
          <h2 className="form-section-title" style={{ color: '#3D7A34' }}>✓ Migration terminée !</h2>
          <p style={{ fontSize: 15, marginBottom: 16 }}>
            <strong style={{ color: '#3D7A34' }}>{results.length} fiches importées</strong>
            {errors.length > 0 && <span style={{ color: '#B0302A' }}> · {errors.length} erreurs</span>}
          </p>
          <Link href="/plats/entrees" className="btn-primary">Voir mes fiches</Link>
          {errors.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#B0302A', marginBottom: 10 }}>Fiches non importées :</p>
              {errors.map(e => (
                <div key={e.slug} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {decodeURIComponent(e.slug)} — {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {results.length > 0 && status === 'migrating' && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Dernières importées :</p>
          {results.slice(-5).reverse().map(r => (
            <div key={r.slug} style={{ padding: '6px 12px', background: 'var(--card-bg)', borderRadius: 6, marginBottom: 4, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>{r.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.type} · {r.categorie}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
