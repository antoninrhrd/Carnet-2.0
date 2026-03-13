'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { createFiche } from '@/lib/actions'
import { SAISONS, UNITE_OPTIONS } from '@/lib/constants'
import type { Ingredient } from '@/lib/types'

interface Props {
  categorie: string
  defaultValues?: {
    nom?: string
    saison?: string
    note_perso?: string
    image_url?: string
    ingredients?: Ingredient[]
    etapes?: string[]
  }
}

function newIngredient(): Ingredient {
  return { id: Math.random().toString(36).slice(2), quantite: '', unite: '', nom: '' }
}

export default function PreparationForm({ categorie, defaultValues }: Props) {
  const [preview, setPreview] = useState<string | null>(defaultValues?.image_url || null)
  const [isPending, startTransition] = useTransition()
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    defaultValues?.ingredients?.length ? defaultValues.ingredients : [newIngredient()]
  )
  const [etapes, setEtapes] = useState<string[]>(
    defaultValues?.etapes?.length ? defaultValues.etapes : ['']
  )
  const formRef = useRef<HTMLFormElement>(null)

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  // Ingredients
  function updateIng(id: string, field: keyof Ingredient, value: string) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }
  function addIng() { setIngredients(prev => [...prev, newIngredient()]) }
  function removeIng(id: string) { setIngredients(prev => prev.filter(i => i.id !== id)) }

  // Etapes
  function updateEtape(idx: number, value: string) {
    setEtapes(prev => { const arr = [...prev]; arr[idx] = value; return arr })
  }
  function addEtape() { setEtapes(prev => [...prev, '']) }
  function removeEtape(idx: number) { setEtapes(prev => prev.filter((_, i) => i !== idx)) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    fd.set('ingredients', JSON.stringify(ingredients.filter(i => i.nom.trim())))
    fd.set('etapes', JSON.stringify(etapes.filter(s => s.trim())))
    startTransition(() => createFiche(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input type="hidden" name="type" value="preparation" />
      <input type="hidden" name="categorie" value={categorie} />

      {/* Infos */}
      <div className="form-section">
        <h2 className="form-section-title">Informations générales</h2>
        <div className="form-group">
          <label className="field-label">Nom de la préparation *</label>
          <input name="nom" required className="field-input" placeholder="Ex. Beurre blanc nantais" defaultValue={defaultValues?.nom} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="field-label">Saison</label>
          <select name="saison" className="field-select" defaultValue={defaultValues?.saison || ''}>
            <option value="">— Choisir —</option>
            {SAISONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Ingrédients */}
      <div className="form-section">
        <h2 className="form-section-title">Ingrédients</h2>
        <div style={{ marginBottom: 4 }}>
          {/* Column headers */}
          <div className="ingredient-row" style={{ marginBottom: 6 }}>
            <span className="field-label" style={{ margin: 0 }}>Quantité</span>
            <span className="field-label" style={{ margin: 0 }}>Unité</span>
            <span className="field-label" style={{ margin: 0 }}>Ingrédient</span>
            <span />
          </div>
          {ingredients.map(ing => (
            <div key={ing.id} className="ingredient-row">
              <input
                className="field-input"
                placeholder="200"
                value={ing.quantite}
                onChange={e => updateIng(ing.id, 'quantite', e.target.value)}
              />
              <select
                className="field-select"
                value={ing.unite}
                onChange={e => updateIng(ing.id, 'unite', e.target.value)}
                style={{ fontSize: 13 }}
              >
                <option value="">—</option>
                {UNITE_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input
                className="field-input"
                placeholder="Beurre doux"
                value={ing.nom}
                onChange={e => updateIng(ing.id, 'nom', e.target.value)}
              />
              <button type="button" className="btn-icon" onClick={() => removeIng(ing.id)} title="Supprimer">×</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-add-row" onClick={addIng}>+ Ajouter un ingrédient</button>
      </div>

      {/* Étapes */}
      <div className="form-section">
        <h2 className="form-section-title">Étapes de préparation</h2>
        {etapes.map((etape, idx) => (
          <div key={idx} className="etape-row">
            <div className="etape-num">{idx + 1}</div>
            <textarea
              className="field-textarea"
              placeholder={`Étape ${idx + 1}…`}
              rows={2}
              value={etape}
              onChange={e => updateEtape(idx, e.target.value)}
              style={{ minHeight: 60 }}
            />
            <button type="button" className="btn-icon" onClick={() => removeEtape(idx)} title="Supprimer">×</button>
          </div>
        ))}
        <button type="button" className="btn-add-row" onClick={addEtape}>+ Ajouter une étape</button>
      </div>

      {/* Image */}
      <div className="form-section">
        <h2 className="form-section-title">Photo</h2>
        <div className="image-upload-zone">
          <input type="file" name="image" accept="image/*" onChange={handleImage} />
          {preview ? (
            <Image src={preview} alt="Aperçu" width={600} height={220} className="image-preview" style={{ objectFit: 'cover' }} />
          ) : (
            <>
              <div className="upload-icon">📷</div>
              <p className="upload-text">Cliquer ou glisser une photo</p>
              <p className="upload-hint">JPG, PNG, WebP — max 5 Mo</p>
            </>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="form-section">
        <h2 className="form-section-title">Note personnelle</h2>
        <textarea
          name="note_perso"
          className="field-textarea"
          placeholder="Astuces, variantes, erreurs à éviter…"
          rows={3}
          defaultValue={defaultValues?.note_perso}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Enregistrement…' : '✓ Enregistrer la fiche'}
        </button>
      </div>
    </form>
  )
}
