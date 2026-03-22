import Link from 'next/link'
import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import FicheCard from '@/components/FicheCard'
import SeasonFilter from '@/components/SeasonFilter'
import SearchBar from '@/components/SearchBar'
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
  searchParams: { saison?: string; q?: string }
}) {
  const supabase = createServerClient()
  let query = supabase.from('fiches').select('*')
  if (searchParams.saison) {
    query = query.eq('saison', searchParams.saison)
  }
  if (searchParams.q) {
    query = query.ilike('nom', `%${searchParams.q}%`)
  }
  const { data: fiches } = await query

  // Only shuffle when not searching
  const displayed = searchParams.q
    ? (fiches as Fiche[]) || []
    : shuffle((fiches as Fiche[]) || [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Toutes les fiches</h1>
          <p className="page-count">
            {displayed.length} fiche{displayed.length !== 1 ? 's' : ''}
            {searchParams.saison ? ` · ${searchParams.saison}` : ''}
            {searchParams.q ? ` · "${searchParams.q}"` : ''}
          </p>
        </div>
        <Link href="/nouvelle-fiche/choisir" className="btn-primary">
          + Nouvelle fiche
        </Link>
      </div>

      <Suspense>
        <SearchBar />
        <SeasonFilter />
      </Suspense>

      <div className="fiche-grid">
        {displayed.map(f => <FicheCard key={f.id} fiche={f} />)}
      </div>

      {displayed.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">Aucun résultat</h3>
          <p className="empty-desc">
            {searchParams.q ? `Aucune fiche pour "${searchParams.q}"` : 'Aucune fiche pour cette saison'}
          </p>
        </div>
      )}
    </>
  )
}
