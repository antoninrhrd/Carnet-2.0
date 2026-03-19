'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { updateFiche } from '@/lib/actions'
import { SAISONS, UNITE_OPTIONS, NAVIGATION } from '@/lib/constants'
import type { Fiche, Ingredient } from '@/lib/types'
import PreparationSelector from '@/components/forms/PreparationSelector'

function newIngredient(): Ingredient {
  return { id: Math.random().toString(36).slice(2), quantite: '', unite: '', nom: '' }
}

// Get categories for a given type
function getCategoriesForType(type: string) {
  const section = NAVIGATION.find(s => s.type === type)
  return section?.categories || []
}

export default function EditFormWrapper({ fiche }: { fiche: Fiche }) {
  const [preview, setPreview] = useState<string | null>(fiche.image_url || null)
  const [isPending, startTransition] = useTransition()
  const [categorie, setCategorie] = useState(fiche.categorie)
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    fiche.ingredients?.length ? fiche.ingredients : [newIngredient()]
  )
  const [etapes, setEtapes] = useState<string[]>(
    fiche.etapes?.length ? fiche.etapes : ['']
  )
  const [preparationIds, setPreparationIds] = useState<string[]>(
    Array.isArray(fiche.preparation_ids) ? fiche.preparation_ids : []
  )
  const formRef = useRef<HTMLFormElement>(null)

  const categories = getCategoriesForType(fiche.type)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function updateIng(id: string, field: keyof Ingredient, value: string) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }
  function addIng() { setIngredients(prev => [...prev, newIngredient()]) }
  function removeIng(id: string) { setIngredients(prev => prev.filter(i => i.id !== id)) }

  function updateEtape(idx: number, value: string) {
    setEtapes(prev => { const arr = [...prev]; arr[idx] = value; return arr })
  }
  function addEtape() { setEtapes(prev => [...prev, '']) }
  function removeEtape(idx: number) { setEtapes(prev => prev.filter((_, i) => i !== idx)) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    if (fiche.type === 'preparation') {
      fd.set('ingredients', JSON.stringify(ingredients.filter(i => i.nom.trim())))
      fd.set('etapes', JSON.stringify(etapes.filter(s => s.trim())))
    }
    if (fiche.type === 'plat') {
      fd.set('preparation_ids', JSON.stringify(preparationIds))
    }
    startTransition(() => updateFiche(fiche.id, fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="type" value={fiche.type} />
      <input type="hidden" name="categorie" value={categorie} />
      <input type="hidden" name="existing_image_url" value={fiche.image_url || ''} />

      {/* Catégorie — always shown if there are subcategories */}
      {categories.length > 0 && (
        <div className="form-section">
          <h2 className="form-section-title">Catégorie</h2>
          <select
            className="field-select"
            value={categorie}
            onChange={e => setCategorie(e.target.value)}
          >
            {categories.map(c => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── PLAT ── */}
      {fiche.type === 'plat' && (
        <>
          <div className="form-section">
            <h2 className="form-section-title">Informations générales</h2>
            <div className="form-group">
              <label className="field-label">Nom du plat *</label>
              <input name="nom" required className="field-input" defaultValue={fiche.nom} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="field-label">Source / Inspiration</label>
                <input name="source" className="field-input" defaultValue={fiche.source || ''} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="field-label">Saison</label>
                <select name="saison" className="field-select" defaultValue={fiche.saison || ''}>
                  <option value="">— Choisir —</option>
                  {SAISONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Éléments du plat</h2>
            <textarea
              name="preparations_libres"
              className="field-textarea"
              placeholder="Ex. Pickles maison, huile de truffe, fleur de sel…"
              rows={3}
              defaultValue={fiche.preparations_libres || ''}
            />
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Préparations associées</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Sélectionnez les préparations qui composent ce plat.
            </p>
            <PreparationSelector selected={preparationIds} onChange={setPreparationIds} />
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Dressage &amp; présentation</h2>
            <textarea name="dressage" className="field-textarea" rows={4} defaultValue={fiche.dressage || ''} />
          </div>
        </>
      )}

      {/* ── PREPARATION ── */}
      {fiche.type === 'preparation' && (
        <>
          <div className="form-section">
            <h2 className="form-section-title">Informations générales</h2>
            <div className="form-group">
              <label className="field-label">Nom *</label>
              <input name="nom" required className="field-input" defaultValue={fiche.nom} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="field-label">Saison</label>
              <select name="saison" className="field-select" defaultValue={fiche.saison || ''}>
                <option value="">— Choisir —</option>
                {SAISONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Ingrédients</h2>
            <div className="ingredient-row" style={{ marginBottom: 6 }}>
              <span className="field-label">Quantité</span>
              <span className="field-label">Unité</span>
              <span className="field-label">Ingrédient</span>
              <span />
            </div>
            {ingredients.map(ing => (
              <div key={ing.id} className="ingredient-row">
                <input className="field-input" value={ing.quantite} onChange={e => updateIng(ing.id, 'quantite', e.target.value)} placeholder="200" />
                <select className="field-select" value={ing.unite} onChange={e => updateIng(ing.id, 'unite', e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">—</option>
                  {UNITE_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input className="field-input" value={ing.nom} onChange={e => updateIng(ing.id, 'nom', e.target.value)} placeholder="Ingrédient" />
                <button type="button" className="btn-icon" onClick={() => removeIng(ing.id)}>×</button>
              </div>
            ))}
            <button type="button" className="btn-add-row" onClick={addIng}>+ Ajouter un ingrédient</button>
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Étapes</h2>
            {etapes.map((etape, idx) => (
              <div key={idx} className="etape-row">
                <div className="etape-num">{idx + 1}</div>
                <textarea className="field-textarea" rows={2} value={etape} onChange={e => updateEtape(idx, e.target.value)} style={{ minHeight: 60 }} />
                <button type="button" className="btn-icon" onClick={() => removeEtape(idx)}>×</button>
              </div>
            ))}
            <button type="button" className="btn-add-row" onClick={addEtape}>+ Ajouter une étape</button>
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Source / Inspiration</h2>
            <input
              name="source_preparation"
              className="field-input"
              placeholder="Ex. Chef Troisgros, livre Escoffier…"
              defaultValue={fiche.source_preparation || ''}
            />
          </div>
        </>
      )}

      {/* ── PRODUIT ── */}
      {fiche.type === 'produit' && (
        <>
          <div className="form-section">
            <h2 className="form-section-title">Produit</h2>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="field-label">Nom *</label>
              <input name="nom" required className="field-input" defaultValue={fiche.nom} />
            </div>
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Fourchette de prix (€/kg)</h2>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="field-label">Prix min</label>
                <input name="prix_min" type="number" min="0" step="0.01" className="field-input" defaultValue={fiche.prix_min ?? ''} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="field-label">Prix max</label>
                <input name="prix_max" type="number" min="0" step="0.01" className="field-input" defaultValue={fiche.prix_max ?? ''} />
              </div>
            </div>
          </div>
          <div className="form-section">
            <h2 className="form-section-title">Note libre</h2>
            <textarea name="note_libre" className="field-textarea" rows={6} defaultValue={fiche.note_libre || ''} />
          </div>
        </>
      )}

      {/* Image (plat + préparation) */}
      {fiche.type !== 'produit' && (
        <div className="form-section">
          <h2 className="form-section-title">Photo</h2>
          <div className="image-upload-zone">
            <input type="file" name="image" accept="image/*" onChange={handleImage} />
            {preview ? (
              <Image src={preview} alt="Aperçu" width={600} height={220} className="image-preview" style={{ objectFit: 'cover' }} />
            ) : (
              <>
                <div className="upload-icon">📷</div>
                <p className="upload-text">Changer la photo</p>
                <p className="upload-hint">JPG, PNG, WebP — max 5 Mo</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Note (plat + prépa) */}
      {fiche.type !== 'produit' && (
        <div className="form-section">
          <h2 className="form-section-title">Note personnelle</h2>
          <textarea name="note_perso" className="field-textarea" rows={3} defaultValue={fiche.note_perso || ''} />
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Enregistrement…' : '✓ Enregistrer les modifications'}
        </button>
      </div>
    </form>
  )
}
