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
  source?: string | null
  dressage?: string | null
  saison?: string | null
  note_perso?: string | null
  ingredients?: Ingredient[]
  etapes?: string[]
  preparations_libres?: string | null
  source_preparation?: string | null
  saving?: boolean
  saved?: boolean
  error?: string
}

function getCatLabel(type: string, slug: string) {
  const section = NAVIGATION.find(s => s.type === type)
  return section?.categories.find(c => c.slug === slug)?.label || slug
}

// Compress image to max 1MB before sending
async function compressImage(dataUrl: string, mediaType: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.75)
      resolve(compressed.split(',')[1])
    }
    img.src = dataUrl
  })
}

export default function ImportPhotoPage() {
  const [images, setImages] = useState<{ preview: string; base64: string; mediaType: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'preview'>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [fiches, setFiches] = useState<FichePreview[]>([])
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const loaded = await Promise.all(files.map(file => new Promise<{preview: string; base64: string; mediaType: string}>((resolve) => {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const result = ev.target?.result as string
        // Compress before storing
        const compressed = await compressImage(result, file.type)
        resolve({ preview: result, base64: compressed, mediaType: 'image/jpeg' })
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
    setFiches(prev => prev.map((f, i) => i === idx ? { ...f, saving: true, error: undefined } : f))
    try {
      const res = await fetch('/api/migrate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fiche)
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setFiches(prev => prev.map((f, i) => i === idx ? { ...f, saving: false, saved: true } : f))
    } catch (err: unknown) {
      setFiches(prev => prev.map((f, i) => i === idx ? { ...f, saving: false, error: err instanceof Error ? err.message : 'Erreur' } : f))
    }
  }

  async function saveAll() {
    setIsSaving(true)
    for (let i = 0; i < fiches.length; i++) {
      if (!fiches[i].saved) await saveFiche(i)
    }
    setIsSaving(false)
  }

  const allSaved = fiches.length > 0 && fiches.every(f => f.saved)

  return (
    <div style={{ maxWidth: 700 }}>
      <Link href="/" className="detail-back">← Retour</Link>
      <h1 className="form-title" style={{ marginBottom: 6 }}>Import depuis photo</h1>
      <p className="form-subtitle" style={{ marginBottom: 28 }}>
        Prends en photo une ou plusieurs pages d'une fiche technique — Claude les analyse et crée les fiches automatiquement.
      </p>

      {status !== 'preview' && (
        <div className="form-section">
          <h2 className="form-section-title">Photos</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            💡 Fiche sur plusieurs pages ? Ajoute toutes les photos avant d'analyser. Assure-toi que le texte est bien lisible et la photo bien éclairée.
          </p>

          <div className="image-upload-zone" style={{ marginBottom: 16 }}>
            <input type="file" accept="image/*" multiple onChange={handleFiles} />
            <div className="upload-icon">📷</div>
            <p className="upload-text">Cliquer ou glisser des photos</p>
            <p className="upload-hint">Plusieurs pages possibles — images compressées automatiquement</p>
          </div>

          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <Image src={img.preview} alt={`Photo ${i + 1}`} width={90} height={90} style={{ objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)' }} />
                  <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10, borderRadius: 3, padding: '1px 5px' }}>
                    Page {i + 1}
                  </span>
                  <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#C04040', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ background: '#FDF0F0', border: '1px solid #E8B8B6', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ color: '#B0302A', fontSize: 13 }}>⚠️ {error}</p>
            </div>
          )}

          <button className="btn-primary" onClick={analyze} disabled={!images.length || status === 'analyzing'} style={{ fontSize: 15, padding: '11px 24px' }}>
            {status === 'analyzing' ? '⏳ Analyse en cours… (peut prendre 20-30s)' : `✨ Analyser ${images.length > 1 ? `les ${images.length} photos` : 'la photo'}`}
          </button>
        </div>
      )}

      {status === 'preview' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              <strong>{fiches.length} fiche{fiches.length > 1 ? 's' : ''}</strong> détectée{fiches.length > 1 ? 's' : ''}. Vérifiez et enregistrez.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => { setStatus('idle'); setFiches([]) }}>← Recommencer</button>
              {!allSaved && (
                <button className="btn-primary" onClick={saveAll} disabled={isSaving}>
                  {isSaving ? 'Enregistrement…' : `✓ Tout enregistrer (${fiches.filter(f => !f.saved).length})`}
                </button>
              )}
            </div>
          </div>

          {allSaved && (
            <div style={{ background: '#F0F5EC', border: '1px solid #B8D4A8', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ color: '#3D7A34', fontSize: 14, fontWeight: 500 }}>✅ Toutes les fiches ont été enregistrées !</p>
              <Link href="/" className="btn-primary" style={{ marginTop: 10, display: 'inline-flex' }}>Voir mes fiches →</Link>
            </div>
          )}

          {fiches.map((fiche, idx) => (
            <div key={idx} className="form-section" style={{
              borderLeft: `3px solid ${fiche.saved ? '#3D7A34' : fiche.error ? '#B0302A' : 'var(--accent)'}`,
              opacity: fiche.saved ? 0.65 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500, marginBottom: 6 }}>{fiche.nom}</h2>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {fiche.type === 'plat' ? 'Plat' : 'Préparation'}
                    </span>
                    <span className="badge" style={{ background: '#F0EDE8', color: 'var(--text-secondary)' }}>
                      {getCatLabel(fiche.type, fiche.categorie)}
                    </span>
                    {fiche.saison && <span className="badge" style={{ background: '#F0F5EC', color: '#3D7A34' }}>{fiche.saison}</span>}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  {!fiche.saved && (
                    <button className="btn-primary" onClick={() => saveFiche(idx)} disabled={fiche.saving}>
                      {fiche.saving ? '…' : '✓ Enregistrer'}
                    </button>
                  )}
                  {fiche.saved && <span style={{ color: '#3D7A34', fontSize: 13, fontWeight: 500 }}>✓ Enregistrée</span>}
                  {fiche.error && <p style={{ color: '#B0302A', fontSize: 11, marginTop: 4, maxWidth: 180 }}>{fiche.error}</p>}
                </div>
              </div>

              {fiche.source && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>📖 {fiche.source}</p>
              )}

              {fiche.preparations_libres && (
                <div style={{ marginBottom: 14, padding: '10px 14px', background: '#FAFAF7', borderRadius: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Éléments du plat</p>
                  <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{fiche.preparations_libres}</p>
                </div>
              )}

              {fiche.ingredients && fiche.ingredients.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Ingrédients ({fiche.ingredients.length})
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {fiche.ingredients.map((ing, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 500, minWidth: 90, flexShrink: 0 }}>{ing.quantite}{ing.unite ? ` ${ing.unite}` : ''}</span>
                        <span>{ing.nom}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {fiche.etapes && fiche.etapes.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Étapes ({fiche.etapes.length})
                  </p>
                  <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fiche.etapes.map((etape, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                        <span style={{ lineHeight: 1.65 }}>{etape}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {fiche.dressage && (
                <div style={{ marginBottom: 10, padding: '10px 14px', background: '#FAFAF7', borderRadius: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Dressage</p>
                  <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{fiche.dressage}</p>
                </div>
              )}

              {fiche.note_perso && (
                <div style={{ padding: '10px 14px', background: '#FAFAF7', borderRadius: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Note</p>
                  <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{fiche.note_perso}</p>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
