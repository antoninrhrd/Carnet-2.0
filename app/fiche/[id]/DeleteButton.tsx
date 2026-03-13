'use client'

import { useState, useTransition } from 'react'
import { deleteFiche } from '@/lib/actions'

interface Props {
  id: string
  type: string
  categorie: string
  nom: string
}

export default function DeleteButton({ id, type, categorie, nom }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function confirm() {
    startTransition(() => deleteFiche(id, type, categorie))
  }

  return (
    <>
      <button className="btn-danger" onClick={() => setOpen(true)}>🗑 Supprimer</button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Supprimer la fiche ?</h2>
            <p className="modal-desc">
              &ldquo;{nom}&rdquo; sera définitivement supprimée. Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-danger" onClick={confirm} disabled={isPending}>
                {isPending ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
