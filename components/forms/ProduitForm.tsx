'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { createFiche } from '@/lib/actions'

interface Props {
  categorie: string
  defaultValues?: {
    nom?: string
    note_libre?: string
    prix_min?: number
    prix_max?: number
    image_url?: string
  }
}

export default function ProduitForm({ categorie, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(defaultValues?.image_url || null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    startTransition(() => createFiche(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="type" value="produit" />
      <input type="hidden" name="categorie" value={categorie} />

      <div className="form-section">
        <h2 className="form-section-title">Produit</h2>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="field-label">Nom du produit *</label>
          <input name="nom" required className="field-input" placeholder="Ex. Beurre de Bresse AOP…" defaultValue={defaultValues?.nom} />
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Fourchette de prix</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Prix au kilogramme en euros</p>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">Prix min (€/kg)</label>
            <input name="prix_min" type="number" min="0" step="0.01" className="field-input" placeholder="12.00" defaultValue={defaultValues?.prix_min} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">Prix max (€/kg)</label>
            <input name="prix_max" type="number" min="0" step="0.01" className="field-input" placeholder="18.00" defaultValue={defaultValues?.prix_max} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Note libre</h2>
        <textarea name="note_libre" className="field-textarea" placeholder="Fournisseurs, qualité, utilisations, alternatives, saisonnalité…" rows={6} defaultValue={defaultValues?.note_libre} />
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

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Enregistrement…' : '✓ Enregistrer la fiche'}
        </button>
      </div>
    </form>
  )
}
