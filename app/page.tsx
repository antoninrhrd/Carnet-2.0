import Link from 'next/link'
import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import FicheCard from '@/components/FicheCard'
import SeasonFilter from '@/components/SeasonFilter'
import type { Fiche } from '@/lib/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { saison?: string }
}) {
  const supabase = createServerClient()
  let query = supabase.from('fiches').select('*')
  if (searchParams.saison) {
    query = query.eq('saison', searchParams.saison)
  }
  const { data: fiches } = await query
  const shuffled = shuffle((fiches as Fiche[]) || [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Toutes les fiches</h1>
          <p className="page-count">
            {shuffled.length} fiche{shuffled.length !== 1 ? 's' : ''}
            {searchParams.saison ? ` · ${searchParams.saison}` : ''}
          </p>
        </div>
        <Link href="/nouvelle-fiche?type=plat&categorie=entrees&section=plats" className="btn-primary">
          + Nouvelle fiche
        </Link>
      </div>

      <Suspense>
        <SeasonFilter />
      </Suspense>

      <div className="fiche-grid">
        {shuffled.map(f => <FicheCard key={f.id} fiche={f} />)}
      </div>

      {shuffled.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">Aucune fiche</h3>
          <p className="empty-desc">Aucune fiche pour cette saison</p>
        </div>
      )}
    </>
  )
}
