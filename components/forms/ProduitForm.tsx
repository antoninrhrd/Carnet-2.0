'use client'

import { useRef, useTransition } from 'react'
import { createFiche } from '@/lib/actions'

interface Props {
  categorie: string
  defaultValues?: {
    nom?: string
    note_libre?: string
    prix_min?: number
    prix_max?: number
  }
}

export default function ProduitForm({ categorie, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    startTransition(() => createFiche(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="type" value="produit" />
      <input type="hidden" name="categorie" value={categorie} />

      {/* Nom */}
      <div className="form-section">
        <h2 className="form-section-title">Produit</h2>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="field-label">Nom du produit *</label>
          <input
            name="nom"
            required
            className="field-input"
            placeholder="Ex. Beurre de Bresse AOP, Fleur de sel de Guérande…"
            defaultValue={defaultValues?.nom}
          />
        </div>
      </div>

      {/* Prix */}
      <div className="form-section">
        <h2 className="form-section-title">Fourchette de prix</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Prix au kilogramme en euros
        </p>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">Prix min (€/kg)</label>
            <input
              name="prix_min"
              type="number"
              min="0"
              step="0.01"
              className="field-input"
              placeholder="12.00"
              defaultValue={defaultValues?.prix_min}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="field-label">Prix max (€/kg)</label>
            <input
              name="prix_max"
              type="number"
              min="0"
              step="0.01"
              className="field-input"
              placeholder="18.00"
              defaultValue={defaultValues?.prix_max}
            />
          </div>
        </div>
      </div>

      {/* Note libre */}
      <div className="form-section">
        <h2 className="form-section-title">Note libre</h2>
        <textarea
          name="note_libre"
          className="field-textarea"
          placeholder="Fournisseurs, qualité, utilisations, alternatives, saisonnalité…"
          rows={6}
          defaultValue={defaultValues?.note_libre}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Enregistrement…' : '✓ Enregistrer la fiche'}
        </button>
      </div>
    </form>
  )
}
