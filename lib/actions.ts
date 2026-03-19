'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from './supabase'

async function uploadImage(supabase: ReturnType<typeof createServerClient>, file: File, type: string): Promise<string | null> {
  if (!file || file.size === 0) return null
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const fileName = `${type}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('fiche-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })
  if (error || !data) return null
  const { data: { publicUrl } } = supabase.storage.from('fiche-images').getPublicUrl(data.path)
  return publicUrl
}

export async function createFiche(formData: FormData) {
  const supabase = createServerClient()
  const type = formData.get('type') as string
  const categorie = formData.get('categorie') as string
  const nom = formData.get('nom') as string

  const imageFile = formData.get('image') as File
  const imageUrl = await uploadImage(supabase, imageFile, type)

  let ficheData: Record<string, unknown> = { type, categorie, nom, image_url: imageUrl }

  if (type === 'plat') {
    const prepIds = formData.get('preparation_ids')
    ficheData = {
      ...ficheData,
      source: formData.get('source') || null,
      dressage: formData.get('dressage') || null,
      saison: formData.get('saison') || null,
      note_perso: formData.get('note_perso') || null,
      preparation_ids: prepIds ? JSON.parse(prepIds as string) : [],
      preparations_libres: formData.get('preparations_libres') || null,
    }
  } else if (type === 'preparation') {
    ficheData = {
      ...ficheData,
      ingredients: JSON.parse((formData.get('ingredients') as string) || '[]'),
      etapes: JSON.parse((formData.get('etapes') as string) || '[]'),
      saison: formData.get('saison') || null,
      note_perso: formData.get('note_perso') || null,
    }
  } else if (type === 'produit') {
    const pMin = formData.get('prix_min')
    const pMax = formData.get('prix_max')
    ficheData = {
      ...ficheData,
      note_libre: formData.get('note_libre') || null,
      prix_min: pMin ? parseFloat(pMin as string) : null,
      prix_max: pMax ? parseFloat(pMax as string) : null,
    }
  }

  const { data, error } = await supabase.from('fiches').insert(ficheData).select().single()
  if (error) throw new Error(error.message)

  const section = type === 'plat' ? 'plats' : type === 'preparation' ? 'preparations' : null
  if (section) {
    revalidatePath(`/${section}/${categorie}`)
    redirect(`/fiche/${data.id}`)
  } else {
    revalidatePath('/produits')
    redirect(`/fiche/${data.id}`)
  }
}

export async function updateFiche(id: string, formData: FormData) {
  const supabase = createServerClient()
  const type = formData.get('type') as string
  const categorie = formData.get('categorie') as string
  const nom = formData.get('nom') as string

  const imageFile = formData.get('image') as File
  const existingImage = formData.get('existing_image_url') as string | null
  const newImageUrl = await uploadImage(supabase, imageFile, type)
  const imageUrl = newImageUrl || existingImage

  let ficheData: Record<string, unknown> = { nom, image_url: imageUrl }

  if (type === 'plat') {
    const prepIds = formData.get('preparation_ids')
    ficheData = {
      ...ficheData,
      source: formData.get('source') || null,
      dressage: formData.get('dressage') || null,
      saison: formData.get('saison') || null,
      note_perso: formData.get('note_perso') || null,
      preparation_ids: prepIds ? JSON.parse(prepIds as string) : [],
      preparations_libres: formData.get('preparations_libres') || null,
    }
  } else if (type === 'preparation') {
    ficheData = {
      ...ficheData,
      ingredients: JSON.parse((formData.get('ingredients') as string) || '[]'),
      etapes: JSON.parse((formData.get('etapes') as string) || '[]'),
      saison: formData.get('saison') || null,
      note_perso: formData.get('note_perso') || null,
    }
  } else if (type === 'produit') {
    const pMin = formData.get('prix_min')
    const pMax = formData.get('prix_max')
    ficheData = {
      ...ficheData,
      note_libre: formData.get('note_libre') || null,
      prix_min: pMin ? parseFloat(pMin as string) : null,
      prix_max: pMax ? parseFloat(pMax as string) : null,
    }
  }

  const { error } = await supabase.from('fiches').update(ficheData).eq('id', id)
  if (error) throw new Error(error.message)

  const section = type === 'plat' ? 'plats' : type === 'preparation' ? 'preparations' : null
  if (section) revalidatePath(`/${section}/${categorie}`)
  else revalidatePath('/produits')
  revalidatePath(`/fiche/${id}`)
  redirect(`/fiche/${id}`)
}

export async function deleteFiche(id: string, type: string, categorie: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('fiches').delete().eq('id', id)
  if (error) throw new Error(error.message)

  const section = type === 'plat' ? 'plats' : type === 'preparation' ? 'preparations' : null
  if (section) {
    revalidatePath(`/${section}/${categorie}`)
    redirect(`/${section}/${categorie}`)
  } else {
    revalidatePath('/produits')
    redirect('/produits')
  }
}
