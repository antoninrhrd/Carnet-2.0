import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { NAVIGATION, SAISON_STYLE } from '@/lib/constants'
import DeleteButton from './DeleteButton'
import IngredientScaler from '@/components/IngredientScaler'
import type { Fiche, Ingredient } from '@/lib/types'

function backHref(fiche: Fiche) {
  if (fiche.type === 'produit') return '/produits'
  const section = fiche.type === 'plat' ? 'plats' : 'preparations'
  return `/${section}/${fiche.categorie}`
}

function sectionLabel(fiche: Fiche) {
  const s = NAVIGATION.find(n => n.type === fiche.type)
  const c = s?.categories.find(c => c.slug === fiche.categorie)
  return { section: s?.label, categorie: c?.label }
}

const CAT_LABEL: Record<string, string> = {}
NAVIGATION.find(s => s.id === 'preparations')?.categories.forEach(c => {
  CAT_LABEL[c.slug] = c.label
})

export default async function FicheDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('fiches').select('*').eq('id', params.id).single()
  if (error || !data) notFound()

  // Fetch linked preparations for plat type
  let linkedPreparations: { id: string; nom: string; categorie: string }[] = []
  try {
    const prepIds = data.preparation_ids
    const ids = Array.isArray(prepIds) ? prepIds : (typeof prepIds === 'string' ? JSON.parse(prepIds) : [])
    if (data.type === 'plat' && ids.length > 0) {
      const { data: preps } = await supabase
        .from('fiches')
        .select('id, nom, categorie')
        .in('id', ids)
      linkedPreparations = preps || []
    }
  } catch {
    linkedPreparations = []
  }

  const fiche = data as Fiche
  const { section, categorie } = sectionLabel(fiche)
  const editHref = `/fiche/${fiche.id}/edit`
  const saison = fiche.saison && SAISON_STYLE[fiche.saison]

  return (
    <div className="fiche-detail">
      <Link href={backHref(fiche)} className="detail-back">← Retour</Link>

      {/* Breadcrumb */}
      <div className="breadcrumb" style={{ marginBottom: 10 }}>
        {section && <span>{section}</span>}
        {categorie && <><span className="breadcrumb-sep">›</span><span>{categorie}</span></>}
      </div>

      {/* Header */}
      <div className="detail-header">
        <div>
          <h1 className="detail-title">{fiche.nom}</h1>
          {fiche.saison && saison && (
            <span
              className="badge"
              style={{ background: saison.bg, color: saison.color, marginTop: 10, display: 'inline-block' }}
            >
              {fiche.saison}
            </span>
          )}
        </div>
        <div className="detail-actions">
          <Link href={editHref} className="btn-secondary">✏ Modifier</Link>
          <DeleteButton id={fiche.id} type={fiche.type} categorie={fiche.categorie} nom={fiche.nom} />
        </div>
      </div>

      {/* Image */}
      {fiche.image_url && (
        <div style={{ position: 'relative', width: '100%', maxHeight: 400, borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
          <Image
            src={fiche.image_url}
            alt={fiche.nom || ''}
            width={780}
            height={400}
            style={{ width: '100%', height: 400, objectFit: 'cover' }}
          />
        </div>
      )}

      {/* ── PLAT ── */}
      {fiche.type === 'plat' && (
        <>
          {fiche.source && (
            <div className="detail-section">
              <div className="detail-field">
                <div className="detail-field-label">Source / Inspiration</div>
                <div className="detail-field-value">{fiche.source}</div>
              </div>
            </div>
          )}

          {/* Préparations libres */}
          {fiche.preparations_libres && (
            <div className="detail-section">
              <h2 className="detail-section-title">Éléments du plat</h2>
              <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>{fiche.preparations_libres}</div>
            </div>
          )}

          {/* Préparations liées */}
          {linkedPreparations.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">Préparations associées</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {linkedPreparations.map(prep => (
                  <Link
                    key={prep.id}
                    href={`/fiche/${prep.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'var(--accent-light)',
                      border: '1px solid rgba(196,98,45,0.2)',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {prep.nom}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {prep.categorie && (
                        <span className="badge" style={{ background: '#F0EDE8', color: 'var(--text-secondary)', fontSize: 11 }}>
                          {CAT_LABEL[prep.categorie] || prep.categorie}
                        </span>
                      )}
                      <span style={{ color: 'var(--accent)', fontSize: 16 }}>→</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {fiche.dressage && (
            <div className="detail-section">
              <h2 className="detail-section-title">Dressage</h2>
              <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>{fiche.dressage}</div>
            </div>
          )}
          {fiche.note_perso && (
            <div className="detail-section">
              <h2 className="detail-section-title">Note personnelle</h2>
              <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>{fiche.note_perso}</div>
            </div>
          )}
        </>
      )}

      {/* ── PREPARATION ── */}
      {fiche.type === 'preparation' && (
        <>
          {fiche.ingredients && fiche.ingredients.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">Ingrédients</h2>
              <IngredientScaler ingredients={fiche.ingredients as Ingredient[]} />
            </div>
          )}
          {fiche.etapes && fiche.etapes.length > 0 && (
            <div className="detail-section">
              <h2 className="detail-section-title">Préparation</h2>
              <ol className="etape-list">
                {(fiche.etapes as string[]).map((etape, i) => (
                  <li key={i} className="etape-item">
                    <span className="etape-bullet">{i + 1}</span>
                    <span className="etape-text">{etape}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {fiche.note_perso && (
            <div className="detail-section">
              <h2 className="detail-section-title">Note personnelle</h2>
              <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>{fiche.note_perso}</div>
            </div>
          )}
          {fiche.source_preparation && (
            <div className="detail-section">
              <h2 className="detail-section-title">Source / Inspiration</h2>
              <div className="detail-field-value">{fiche.source_preparation}</div>
            </div>
          )}
        </>
      )}

      {/* ── PRODUIT ── */}
      {fiche.type === 'produit' && (
        <>
          {(fiche.prix_min != null || fiche.prix_max != null) && (
            <div className="detail-section">
              <h2 className="detail-section-title">Prix</h2>
              <div className="prix-range">
                💶{' '}
                {fiche.prix_min != null ? `${fiche.prix_min}` : '?'}
                {fiche.prix_max != null && fiche.prix_max !== fiche.prix_min ? ` – ${fiche.prix_max}` : ''}
                {' '}€ / kg
              </div>
            </div>
          )}
          {fiche.note_libre && (
            <div className="detail-section">
              <h2 className="detail-section-title">Notes</h2>
              <div className="detail-field-value" style={{ whiteSpace: 'pre-wrap' }}>{fiche.note_libre}</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
