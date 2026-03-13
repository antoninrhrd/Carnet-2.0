import { Suspense } from 'react'
import NouvellesFicheContent from './NouvellesFicheContent'

export default function NouvelleFichePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-muted)' }}>Chargement…</div>}>
      <NouvellesFicheContent />
    </Suspense>
  )
}
