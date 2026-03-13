import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { NAVIGATION, getCategoryLabel } from '@/lib/constants'
import FicheGrid from '@/components/FicheGrid'
import type { Fiche } from '@/lib/types'

const SECTION = NAVIGATION.find(s => s.id === 'plats')!

export async function generateStaticParams() {
  return SECTION.categories.map(c => ({ categorie: c.slug }))
}

export default async function PlatsCategoriePage({
  params,
}: {
  params: { categorie: string }
}) {
  const { categorie } = params
  const isValid = SECTION.categories.some(c => c.slug === categorie)
  if (!isValid) notFound()

  const supabase = createServerClient()
  const { data: fiches } = await supabase
    .from('fiches')
    .select('*')
    .eq('type', 'plat')
    .eq('categorie', categorie)
    .order('created_at', { ascending: false })

  const label = getCategoryLabel('plats', categorie)
  const newHref = `/nouvelle-fiche?type=plat&categorie=${categorie}&section=plats`

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Plats</span>
            <span className="breadcrumb-sep">›</span>
            <span style={{ color: 'var(--text-primary)' }}>{label}</span>
          </div>
          <h1 className="page-title">{label}</h1>
          <p className="page-count">
            {fiches?.length || 0} fiche{(fiches?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href={newHref} className="btn-primary">+ Nouvelle fiche</Link>
      </div>

      <FicheGrid fiches={(fiches as Fiche[]) || []} emptyHref={newHref} />
    </>
  )
}
