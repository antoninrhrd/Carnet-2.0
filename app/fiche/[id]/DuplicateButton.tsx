'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function DuplicateButton({ id, nom }: { id: string; nom: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function duplicate() {
    startTransition(async () => {
      const res = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (data.ok) router.push(`/fiche/${data.id}/edit`)
    })
  }

  return (
    <button className="btn-secondary" onClick={duplicate} disabled={isPending} title={`Dupliquer "${nom}"`}>
      {isPending ? '…' : '⎘ Dupliquer'}
    </button>
  )
}
