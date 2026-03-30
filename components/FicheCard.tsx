'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import type { Fiche } from '@/lib/types'
import { SAISON_STYLE } from '@/lib/constants'

function placeholderClass(categorie: string): string {
  const map: Record<string, string> = {
    'entrees': 'placeholder-entrees',
    'entrees-vege': 'placeholder-entrees-vege',
    'plats-vege': 'placeholder-plats-vege',
    'plats-viande': 'placeholder-plats-viande',
    'plats-poisson': 'placeholder-plats-poisson',
    'desserts': 'placeholder-desserts',
    'pates': 'placeholder-pates',
    'pasta': 'placeholder-pasta',
    'sauces': 'placeholder-sauces',
    'condiments': 'placeholder-condiments',
    'produits': 'placeholder-produits',
  }
  return map[categorie] || 'placeholder-default'
}

export default function FicheCard({ fiche }: { fiche: Fiche }) {
  const [imgError, setImgError] = useState(false)

  const initials = fiche.nom
    ? fiche.nom.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  const showImage = fiche.image_url && !imgError

  return (
    <Link href={`/fiche/${fiche.id}`} className="fiche-card">
      <div className="fiche-card-media">
        {showImage ? (
          <Image
            src={fiche.image_url!}
            alt={fiche.nom || ''}
            fill
            className="fiche-card-img"
            sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 220px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`fiche-card-placeholder ${placeholderClass(fiche.categorie)}`}>
            {initials}
          </div>
        )}
      </div>

      <div className="fiche-card-body">
        <div className="fiche-card-name">{fiche.nom || '—'}</div>
        <div className="fiche-card-meta">
          {fiche.saison && (
            <span
              className="badge"
              style={SAISON_STYLE[fiche.saison]
                ? { background: SAISON_STYLE[fiche.saison].bg, color: SAISON_STYLE[fiche.saison].color }
                : {}
              }
            >
              {fiche.saison}
            </span>
          )}
          {fiche.type === 'produit' && fiche.prix_min != null && (
            <span className="badge" style={{ background: '#F0F5EC', color: '#3D7A34' }}>
              {fiche.prix_min}
              {fiche.prix_max && fiche.prix_max !== fiche.prix_min ? `–${fiche.prix_max}` : ''}
              {' '}€/kg
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
