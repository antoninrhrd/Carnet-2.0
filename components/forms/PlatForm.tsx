'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { createFiche } from '@/lib/actions'
import { SAISONS } from '@/lib/constants'
import PreparationSelector from './PreparationSelector'

export default function PlatForm({ categorie, defaultValues }: {
  categorie: string
  defaultValues?: Record<string, string> & { preparation_ids?: string[] }
}) {
  const [preview, setPreview] = useState<string | null>(defaultValues?.image_url || null)
  const [isPending, startTransition] = useTransition()
  const [preparationIds, setPreparationIds] = useState<string[]>(defaultValues?.preparation_ids || [])
  const formRef = useRef<HTMLFormElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    fd.set('preparation_ids', JSON.stringify(preparationIds))
    startTransition(() => createFiche(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="type" value="plat" />
      <input type="hidden" name="categorie" value={categorie} />

      <div className="form-section">
        <h2 className="form-section-title">Informations générales</h2>
        <div className="form-group">
          <label className="field-label">Nom du plat *</label>
          <input name="nom" required className="field-input" placeholder="Ex. Tartare de bœuf classique" defaultValue={defaultValues?.nom} />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">Source / Inspiration</label>
            <input name="source" className="field-input" placeholder="Ex. Restaurant Le Baratin…" defaultValue={defaultValues?.source} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">Saison</label>
            <select name="saison" className="field-select" defaultValue={defaultValues?.saison || ''}>
              <option value="">— Choisir —</option>
              {SAISONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Préparations associées</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Sélectionnez les préparations déjà enregistrées qui composent ce plat.
        </p>
        <PreparationSelector selected={preparationIds} onChange={setPreparationIds} />
        <div style={{ marginTop: 16 }}>
          <label className="field-label">Autres préparations / ingrédients non enregistrés</label>
          <textarea
            name="preparations_libres"
            className="field-textarea"
            placeholder="Ex. Pickles maison, huile de truffe, fleur de sel…"
            rows={3}
            defaultValue={defaultValues?.preparations_libres}
            style={{ marginTop: 6 }}
          />
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Dressage &amp; présentation</h2>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="field-label">Notes de dressage</label>
          <textarea name="dressage" className="field-textarea" placeholder="Décrire le dressage, les finitions, la garniture…" rows={4} defaultValue={defaultValues?.dressage} />
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Photo</h2>
        <div className="image-upload-zone">
          <input type="file" name="image" accept="image/*" onChange={handleImage} />
          {preview ? (
            <Image src={preview} alt="Aperçu" width={600} height={220} className="image-preview" style={{ objectFit: 'cover' }} />
          ) : (
            <>
              <div className="upload-icon">📷</div>
              <p className="upload-text">Cliquer ou glisser une photo</p>
              <p className="upload-hint">JPG, PNG, WebP — max 5 Mo</p>
            </>
          )}
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Note personnelle</h2>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <textarea name="note_perso" className="field-textarea" placeholder="Remarques, variantes, souvenirs liés à ce plat…" rows={3} defaultValue={defaultValues?.note_perso} />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Enregistrement…' : '✓ Enregistrer la fiche'}
        </button>
      </div>
    </form>
  )
}
