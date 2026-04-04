export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { NAVIGATION, getCategoryLabel, getAllergeneBySlug } from '@/lib/constants'
import FicheGrid from '@/components/FicheGrid'
import SeasonFilter from '@/components/SeasonFilter'
import AllergenFilter from '@/components/AllergenFilter'
import type { Fiche } from '@/lib/types'

const SECTION = NAVIGATION.find(s => s.id === 'plats')!

export default async function PlatsCategoriePage({
  params, searchParams,
}: {
  params: { categorie: string }
  searchParams: { saison?: string; sans?: string }
}) {
  const { categorie } = params
  if (!SECTION.categories.some(c => c.slug === categorie)) notFound()

  const supabase = createServerClient()
  let query = supabase.from('fiches').select('*').eq('type', 'plat').eq('categorie', categorie).order('created_at', { ascending: false })
  if (searchParams.saison) query = query.eq('saison', searchParams.saison)

  const { data: fiches } = await query
  let filtered = (fiches as Fiche[]) || []

  // "Sans X" : exclure les fiches qui CONTIENNENT cet allergène
  if (searchParams.sans) {
    filtered = filtered.filter(f => !(f.allergenes || []).includes(searchParams.sans!))
  }

  const label = getCategoryLabel('plats', categorie)
  const newHref = `/nouvelle-fiche?type=plat&categorie=${categorie}&section=plats`
  const allergeneLabel = searchParams.sans ? getAllergeneBySlug(searchParams.sans)?.label : null

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Plats</span><span className="breadcrumb-sep">›</span>
            <span style={{ color: 'var(--text-primary)' }}>{label}</span>
          </div>
          <h1 className="page-title">{label}</h1>
          <p className="page-count">
            {filtered.length} fiche{filtered.length !== 1 ? 's' : ''}
            {searchParams.saison ? ` · ${searchParams.saison}` : ''}
            {allergeneLabel ? ` · sans ${allergeneLabel}` : ''}
          </p>
        </div>
        <Link href={newHref} className="btn-primary">+ Nouvelle fiche</Link>
      </div>
      <Suspense>
        <SeasonFilter />
        <AllergenFilter />
      </Suspense>
      <FicheGrid fiches={filtered} emptyHref={newHref} />
    </>
  )
}

