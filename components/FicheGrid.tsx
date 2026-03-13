import type { Fiche } from '@/lib/types'
import FicheCard from './FicheCard'
import Link from 'next/link'

interface Props {
  fiches: Fiche[]
  emptyHref: string
}

export default function FicheGrid({ fiches, emptyHref }: Props) {
  if (fiches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3 className="empty-title">Aucune fiche pour l&apos;instant</h3>
        <p className="empty-desc">Commencez par créer votre première fiche dans cette catégorie</p>
        <Link href={emptyHref} className="btn-primary">
          + Nouvelle fiche
        </Link>
      </div>
    )
  }

  return (
    <div className="fiche-grid">
      {fiches.map(f => <FicheCard key={f.id} fiche={f} />)}
    </div>
  )
}
