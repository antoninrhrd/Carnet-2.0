export type SaisonType = 'Printemps' | 'Été' | 'Automne' | 'Hiver' | 'Toute saison'
export type FicheType = 'plat' | 'preparation' | 'produit'

export interface Ingredient {
  id: string
  quantite: string
  unite: string
  nom: string
}

export interface Fiche {
  id: string
  type: FicheType
  categorie: string
  nom: string
  // Plat fields
  source?: string
  dressage?: string
  preparations_libres?: string
  preparation_ids?: string[]
  // Preparation fields
  ingredients?: Ingredient[]
  etapes?: string[]
  source_preparation?: string
  // Shared
  saison?: SaisonType
  note_perso?: string
  image_url?: string
  // Allergens
  allergenes?: string[]
  // Produit fields
  note_libre?: string
  prix_min?: number
  prix_max?: number
  created_at: string
  updated_at: string
}

export interface PreparationSummary {
  id: string
  nom: string
  categorie: string
}
