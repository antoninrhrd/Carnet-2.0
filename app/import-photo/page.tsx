'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { NAVIGATION } from '@/lib/constants'
import type { Ingredient } from '@/lib/types'

interface FichePreview {
  type: string
  categorie: string
  nom: string
  source?: string
  dressage?: string
  saison?: string
  note_perso?: string
  ingredients?: Ingredient[]
  etapes?: string[]
  preparations_libres?: string
  saving?: boolean
  saved?: boolean
  error?: string
}

const TYPE_LABELS: Record<string, string> = {
  plat: 'Plat',
  preparation: 'Préparation',
}

function getCatLabel(type: string, slug: string) {
  const section = NAVIGATION.find(s => s.type === type)
  return section?.categories.find(c => c.slug === slug)?.label || slug
}

export default function ImportPhotoPage() {
  const [images, setImages] = useState<{ preview: string; base64: string; mediaType: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview' | 'saving' | 'done'>('idle')
  const [fiches, setFiches] = useState<FichePreview[]>([])
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const loaded = await Promise.all(files.map(file => new Promise<{preview: string; base64: string; mediaType: string}>((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        const base64 = result.split(',')[1]
        resolve({ preview: result, base64, mediaType: file.type })
      }
      reader.readAsDataURL(file)
    })))
    setImages(prev => [...prev, ...loaded])
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function analyze() {
    if (!images.length) return
    setStatus('analyzing')
    setError('')
    try {
      const res = await fetch('/api/import-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: images.map(i => ({ data: i.base64, mediaType: i.mediaType })) })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setFiches(data.fiches)
      setStatus('preview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('idle')
    }
  }

  async function saveFiche(idx: number) {
    const fiche = fiches[idx]
    setFiches(prev => prev.map((f, i) => i === idx ? { ...f, saving: true } : f))
    try {
      const res = await fetch('/api/migrate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: fiche, type: fiche.type, categorie: fiche.categorie })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setFiches(prev => prev.map((f, i) => i === idx ? { ...f, saving: false, saved: true } : f))
    } catch (err: unknown) {
      setFiches(prev => prev.map((f, i) => i === idx ? { ...f, saving: false, error: err instanceof Error ? err.message : 'Erreur' } : f))
    }
  }

  async function saveAll() {
    setStatus('saving')
    for (let i = 0; i < fiches.length; i++) {
      if (!fiches[i].saved) await saveFiche(i)
    }
    setStatus('preview')
  }

  const allSaved = fiches.length > 0 && fiches.every(f => f.saved)

  return (
    <div style={{ maxWidth: 700 }}>
      <Link href="/" className="detail-back">← Retour</Link>
      <h1 className="form-title" style={{ marginBottom: 6 }}>Import depuis photo</h1>
      <p className="form-subtitle" style={{ marginBottom: 28 }}>
        Prends en photo une ou plusieurs fiches techniques — Claude les analyse et crée les fiches automatiquement.
      </p>

      {/* Upload zone */}
      {status !== 'preview' && (
        <div className="form-section">
          <h2 className="form-section-title">Photos</h2>

          <div className="image-upload-zone" style={{ marginBottom: images.length ? 16 : 0 }}>
            <input type="file" accept="image/*" multiple onChange={handleFiles} />
            <div className="upload-icon">📷</div>
            <p className="upload-text">Cliquer ou glisser des photos de fiches techniques</p>
            <p className="upload-hint">JPG, PNG, WebP — plusieurs photos possibles</p>
          </div>

          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <Image src={img.preview} alt={`Photo ${i + 1}`} width={100} height={100} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#C04040', color: 'white',
                      border: 'none', cursor: 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ color: '#B0302A', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            className="btn-primary"
            onClick={analyze}
            disabled={!images.length || status === 'analyzing'}
            style={{ fontSize: 15, padding: '11px 24px' }}
          >
            {status === 'analyzing' ? '⏳ Analyse en cours…' : '✨ Analyser les photos'}
          </button>
        </div>
      )}

      {/* Preview */}
      {status === 'preview' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              <strong>{fiches.length} fiche{fiches.length > 1 ? 's' : ''}</strong> détectée{fiches.length > 1 ? 's' : ''}. Vérifiez et enregistrez.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => { setStatus('idle'); setFiches([]) }}>
                ← Recommencer
              </button>
              {!allSaved && (
                <button className="btn-primary" onClick={saveAll} disabled={status === 'saving'}>
                  {status === 'saving' ? 'Enregistrement…' : `✓ Tout enregistrer (${fiches.filter(f => !f.saved).length})`}
                </button>
              )}
            </div>
          </div>

          {allSaved && (
            <div style={{ background: '#F0F5EC', border: '1px solid #B8D4A8', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ color: '#3D7A34', fontSize: 14, fontWeight: 500 }}>
                ✅ Toutes les fiches ont été enregistrées !
              </p>
              <Link href="/" className="btn-primary" style={{ marginTop: 10, display: 'inline-flex' }}>
                Voir mes fiches →
              </Link>
            </div>
          )}

          {fiches.map((fiche, idx) => (
            <div key={idx} className="form-section" style={{
              opacity: fiche.saved ? 0.6 : 1,
              borderLeft: fiche.saved ? '3px solid #3D7A34' : fiche.error ? '3px solid #B0302A' : '3px solid var(--accent)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500, marginBottom: 4 }}>
                    {fiche.nom}
                  </h2>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {TYPE_LABELS[fiche.type] || fiche.type}
                    </span>
                    <span className="badge" style={{ background: '#F0EDE8', color: 'var(--text-secondary)' }}>
                      {getCatLabel(fiche.type, fiche.categorie)}
                    </span>
                    {fiche.saison && (
                      <span className="badge" style={{ background: '#F0F5EC', color: '#3D7A34' }}>
                        {fiche.saison}
                      </span>
                    )}
                  </div>
                </div>
                {!fiche.saved && (
                  <button
                    className="btn-primary"
                    onClick={() => saveFiche(idx)}
                    disabled={fiche.saving}
                    style={{ flexShrink: 0 }}
                  >
                    {fiche.saving ? '…' : '✓ Enregistrer'}
                  </button>
                )}
                {fiche.saved && <span style={{ color: '#3D7A34', fontSize: 13, fontWeight: 500 }}>✓ Enregistrée</span>}
                {fiche.error && <span style={{ color: '#B0302A', fontSize: 12 }}>{fiche.error}</span>}
              </div>

              {fiche.source && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  <strong>Source :</strong> {fiche.source}
                </p>
              )}

              {fiche.preparations_libres && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Éléments du plat</p>
                  <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{fiche.preparations_libres}</p>
                </div>
              )}

              {fiche.ingredients && fiche.ingredients.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Ingrédients</p>
                  <ul style={{ listStyle: 'none', fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {fiche.ingredients.map((ing, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 500, minWidth: 80 }}>{ing.quantite} {ing.unite}</span>
                        <span>{ing.nom}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {fiche.etapes && fiche.etapes.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Étapes</p>
                  <ol style={{ listStyle: 'none', fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {fiche.etapes.map((etape, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ lineHeight: 1.6 }}>{etape}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {fiche.dressage && (
                <div>
                  <p style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Dressage</p>
                  <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{fiche.dressage}</p>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
