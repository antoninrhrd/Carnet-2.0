'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NAVIGATION } from '@/lib/constants'
import PlatForm from '@/components/forms/PlatForm'
import PreparationForm from '@/components/forms/PreparationForm'
import ProduitForm from '@/components/forms/ProduitForm'

export default function NouvellesFicheContent() {
  const sp = useSearchParams()
  const type = sp.get('type') || 'plat'
  const categorie = sp.get('categorie') || ''
  const section = sp.get('section') || ''

  const sectionObj = NAVIGATION.find(s => s.id === section)
  const catObj = sectionObj?.categories.find(c => c.slug === categorie)
  const backHref = section ? (sectionObj?.categories.length ? `/${section}/${categorie}` : `/${section}`) : '/'

  const typeLabel = type === 'plat' ? 'Plat' : type === 'preparation' ? 'Préparation' : 'Fiche produit'

  return (
    <div className="form-page">
      <Link href={backHref} className="detail-back">← Retour</Link>

      <div className="breadcrumb" style={{ marginBottom: 6 }}>
        {sectionObj && <span>{sectionObj.label}</span>}
        {catObj && <><span className="breadcrumb-sep">›</span><span>{catObj.label}</span></>}
      </div>

      <h1 className="form-title">Nouvelle fiche</h1>
      <p className="form-subtitle">Type : {typeLabel}</p>

      {type === 'plat' && <PlatForm categorie={categorie} />}
      {type === 'preparation' && <PreparationForm categorie={categorie} />}
      {type === 'produit' && <ProduitForm categorie="produits" />}
    </div>
  )
}
