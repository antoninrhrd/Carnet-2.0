export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import FicheGrid from '@/components/FicheGrid'
import type { Fiche } from '@/lib/types'

export default async function ProduitsPage() {
  const supabase = createServerClient()
  const { data: fiches } = await supabase
    .from('fiches')
    .select('*')
    .eq('type', 'produit')
    .order('created_at', { ascending: false })

  const newHref = '/nouvelle-fiche?type=produit&categorie=produits&section=produits'

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fiches produit</h1>
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
