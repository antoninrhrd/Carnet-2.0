export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { NAVIGATION, getCategoryLabel } from '@/lib/constants'
import FicheGrid from '@/components/FicheGrid'
import SeasonFilter from '@/components/SeasonFilter'
import AllergenFilter from '@/components/AllergenFilter'
import type { Fiche } from '@/lib/types'

const SECTION = NAVIGATION.find(s => s.id === 'preparations')!

export default async function PreparationCategoriePage({
  params, searchParams,
}: {
  params: { categorie: string }
  searchParams: { saison?: string; allergene?: string }
}) {
  const { categorie } = params
  const isValid = SECTION.categories.some(c => c.slug === categorie)
  if (!isValid) notFound()

  const supabase = createServerClient()
  let query = supabase.from('fiches').select('*').eq('type', 'preparation').eq('categorie', categorie).order('created_at', { ascending: false })
  if (searchParams.saison) query = query.eq('saison', searchParams.saison)

  const { data: fiches } = await query

  let filtered = (fiches as Fiche[]) || []
  if (searchParams.allergene) {
    filtered = filtered.filter(f => (f.allergenes || []).includes(searchParams.allergene!))
  }

  const label = getCategoryLabel('preparations', categorie)
  const newHref = `/nouvelle-fiche?type=preparation&categorie=${categorie}&section=preparations`

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Préparations</span><span className="breadcrumb-sep">›</span>
            <span style={{ color: 'var(--text-primary)' }}>{label}</span>
          </div>
          <h1 className="page-title">{label}</h1>
          <p className="page-count">{filtered.length} fiche{filtered.length !== 1 ? 's' : ''}{searchParams.saison ? ` · ${searchParams.saison}` : ''}{searchParams.allergene ? ` · ${searchParams.allergene}` : ''}</p>
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
