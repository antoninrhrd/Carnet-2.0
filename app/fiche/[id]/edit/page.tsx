import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import EditFormWrapper from './EditFormWrapper'
import type { Fiche } from '@/lib/types'

export default async function EditFichePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('fiches').select('*').eq('id', params.id).single()
  if (error || !data) notFound()

  const fiche = data as Fiche

  return (
    <div className="form-page">
      <Link href={`/fiche/${fiche.id}`} className="detail-back">← Retour à la fiche</Link>

      <h1 className="form-title">Modifier la fiche</h1>
      <p className="form-subtitle">{fiche.nom}</p>

      <EditFormWrapper fiche={fiche} />
    </div>
  )
}
