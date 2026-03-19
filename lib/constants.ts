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

export const UNITE_OPTIONS = ['g', 'kg', 'ml', 'cl', 'L', 'pièce(s)', 'c. à s.', 'c. à c.', 'pincée', 'brin(s)', 'feuille(s)', 'tranche(s)']

export const SAISON_STYLE: Record<string, { bg: string; color: string }> = {
  Printemps: { bg: '#E8F5E2', color: '#3D7A34' },
  Été: { bg: '#FEF3E2', color: '#B86B1A' },
  Automne: { bg: '#FAE8E8', color: '#8B2E2E' },
  Hiver: { bg: '#E3EEF7', color: '#2D5F8A' },
  'Toute saison': { bg: '#F0F0EC', color: '#5A5A4A' },
}

export function getSectionByType(type: FicheType): NavSection | undefined {
  return NAVIGATION.find(s => s.type === type)
}

export function getCategoryLabel(sectionId: string, slug: string): string {
  const section = NAVIGATION.find(s => s.id === sectionId)
  const cat = section?.categories.find(c => c.slug === slug)
  return cat?.label || slug
}
