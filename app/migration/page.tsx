'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Result {
  slug: string
  name?: string
  type?: string
  categorie?: string
  error?: string
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

    // 1. Get slugs from our server route (hardcoded list)
    const slugsRes = await fetch('/api/migrate/slugs')
    const { slugs } = await slugsRes.json()
    setTotal(slugs.length)

    // 2. Import each one via server route
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i]
      setCurrent(decodeURIComponent(slug))
      setDone(i)

      const res = await fetch(`/api/migrate/recipe?slug=${encodeURIComponent(slug)}`)
      const data = await res.json()

      if (data.ok) {
        setResults(prev => [...prev, { slug, name: data.name, type: data.type, categorie: data.categorie }])
      } else {
        setErrors(prev => [...prev, { slug, error: data.error }])
      }

      await new Promise(r => setTimeout(r, 500))
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
            L&apos;outil va importer toutes tes fiches depuis <strong>antonin-sigma.vercel.app</strong>.
            Ça prend environ <strong>2-3 minutes</strong>.
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
          {!total && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Démarrage…</p>}
          {current && <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>En cours : {current}</p>}

          {results.slice(-5).reverse().map(r => (
            <div key={r.slug} style={{ padding: '6px 12px', background: '#FAFAF7', borderRadius: 6, marginBottom: 4, fontSize: 13, display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>{r.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.type} · {r.categorie}</span>
            </div>
          ))}
        </div>
      )}

      {status === 'done' && (
        <div className="form-section">
          <h2 className="form-section-title" style={{ color: '#3D7A34' }}>✓ Migration terminée !</h2>
          <p style={{ fontSize: 15, marginBottom: 20 }}>
            <strong style={{ color: '#3D7A34' }}>{results.length} fiches importées</strong>
            {errors.length > 0 && <span style={{ color: '#B0302A' }}> · {errors.length} erreurs</span>}
          </p>
          <Link href="/plats/entrees" className="btn-primary">Voir mes fiches →</Link>

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
    </div>
  )
}
