import type { FicheType } from './types'

export interface Category {
  slug: string
  label: string
}

export interface NavSection {
  id: string
  label: string
  emoji: string
  type: FicheType
  categories: Category[]
}

export const NAVIGATION: NavSection[] = [
  {
    id: 'plats',
    label: 'Plats',
    emoji: '🍽',
    type: 'plat',
    categories: [
      { slug: 'entrees', label: 'Entrées' },
      { slug: 'entrees-vege', label: 'Entrées végé' },
      { slug: 'plats-vege', label: 'Plats végé' },
      { slug: 'plats-viande', label: 'Plats viande' },
      { slug: 'plats-poisson', label: 'Plats poisson' },
      { slug: 'plats-crustace', label: 'Plats crustacé' },
      { slug: 'plats-mollusque', label: 'Plats mollusque' },
      { slug: 'desserts', label: 'Desserts' },
    ],
  },
  {
    id: 'preparations',
    label: 'Préparations',
    emoji: '🔪',
    type: 'preparation',
    categories: [
      { slug: 'pates', label: 'Pâtes' },
      { slug: 'pasta', label: 'Pasta' },
      { slug: 'sauces', label: 'Sauces' },
      { slug: 'condiments', label: 'Condiments' },
      { slug: 'sucre', label: 'Sucré' },
      { slug: 'autre', label: 'Autre' },
    ],
  },
  {
    id: 'produits',
    label: 'Fiches produit',
    emoji: '📋',
    type: 'produit',
    categories: [],
  },
]

export const SAISONS = ['Printemps', 'Été', 'Automne', 'Hiver', 'Toute saison'] as const

export const ALLERGENES: { slug: string; label: string; emoji: string; color: string; bg: string }[] = [
  { slug: 'gluten',    label: 'Gluten',          emoji: '🌾', color: '#B86B1A', bg: '#FEF3E2' },
  { slug: 'lactose',   label: 'Lait / Lactose',   emoji: '🥛', color: '#2D5F8A', bg: '#E3EEF7' },
  { slug: 'oeufs',     label: 'Œufs',             emoji: '🥚', color: '#8B6914', bg: '#FBF4DC' },
  { slug: 'poisson',   label: 'Poisson',           emoji: '🐟', color: '#1A6B8A', bg: '#DCF0F7' },
  { slug: 'crustaces', label: 'Crustacés',         emoji: '🦐', color: '#8A2D1A', bg: '#F7E0DC' },
  { slug: 'mollusques',label: 'Mollusques',        emoji: '🦑', color: '#4A2D8A', bg: '#EBE3F7' },
  { slug: 'arachides', label: 'Arachides',         emoji: '🥜', color: '#6B3A14', bg: '#F5E8DC' },
  { slug: 'fruits-a-coque', label: 'Fruits à coque', emoji: '🌰', color: '#5A3A0A', bg: '#F5EDDC' },
  { slug: 'soja',      label: 'Soja',              emoji: '🫘', color: '#3A6B14', bg: '#E5F0DC' },
  { slug: 'celeri',    label: 'Céleri',            emoji: '🥬', color: '#2A6B2A', bg: '#DCF0DC' },
  { slug: 'moutarde',  label: 'Moutarde',          emoji: '🌼', color: '#8A7A00', bg: '#F7F4D0' },
  { slug: 'sesame',    label: 'Sésame',            emoji: '🌿', color: '#6B5A14', bg: '#F5EFDC' },
  { slug: 'sulfites',  label: 'Sulfites',          emoji: '🍷', color: '#6B1A3A', bg: '#F5DCE8' },
  { slug: 'lupin',     label: 'Lupin',             emoji: '🌸', color: '#6B1A6B', bg: '#F5DCF5' },
  { slug: 'vegan',     label: 'Vegan',             emoji: '🌱', color: '#1A6B1A', bg: '#DCF5DC' },
]

export const UNITE_OPTIONS = ['g', 'kg', 'ml', 'cl', 'L', 'pièce(s)', 'c. à s.', 'c. à c.', 'pincée', 'brin(s)', 'feuille(s)', 'tranche(s)']

export const SAISON_STYLE: Record<string, { bg: string; color: string }> = {
  Printemps: { bg: '#E8F5E2', color: '#3D7A34' },
  Été: { bg: '#FEF3E2', color: '#B86B1A' },
  Automne: { bg: '#FAE8E8', color: '#8B2E2E' },
  Hiver: { bg: '#E3EEF7', color: '#2D5F8A' },
  'Toute saison': { bg: '#F0F0EC', color: '#5A5A4A' },
}

export function getAllergeneBySlug(slug: string) {
  return ALLERGENES.find(a => a.slug === slug)
}

export function getSectionByType(type: FicheType): NavSection | undefined {
  return NAVIGATION.find(s => s.type === type)
}

export function getCategoryLabel(sectionId: string, slug: string): string {
  const section = NAVIGATION.find(s => s.id === sectionId)
  const cat = section?.categories.find(c => c.slug === slug)
  return cat?.label || slug
}
