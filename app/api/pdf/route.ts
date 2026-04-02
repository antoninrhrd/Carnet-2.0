import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { Ingredient } from '@/lib/types'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new NextResponse('Missing id', { status: 400 })

  const supabase = createServerClient()
  const { data: fiche, error } = await supabase.from('fiches').select('*').eq('id', id).single()
  if (error || !fiche) return new NextResponse('Not found', { status: 404 })

  const ingredients = (fiche.ingredients || []) as Ingredient[]
  const etapes = (fiche.etapes || []) as string[]
  const allergenes = (fiche.allergenes || []) as string[]

  const allergeneBadges = allergenes.map(a =>
    `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;margin-right:6px;background:${a === 'Gluten' ? '#FEF3E2' : '#E3EEF7'};color:${a === 'Gluten' ? '#B86B1A' : '#2D5F8A'}">${a === 'Gluten' ? '🌾' : '🥛'} ${a}</span>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${fiche.nom}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; color: #282820; background: white; padding: 40px; max-width: 720px; margin: 0 auto; }
  h1 { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 500; margin-bottom: 10px; }
  h2 { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: #8C7B6B; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E0D8CC; margin-top: 24px; }
  .meta { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
  .badge { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 500; }
  .source { font-size: 13px; color: #6A6A58; margin-bottom: 16px; }
  .ingredient-row { display: flex; gap: 16px; padding: 5px 0; border-bottom: 1px solid #F0EDE8; font-size: 14px; }
  .qty { color: #C4622D; font-weight: 500; min-width: 100px; }
  .etape { display: flex; gap: 12px; margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
  .num { width: 24px; height: 24px; border-radius: 50%; background: #C4622D; color: white; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .block { background: #FAFAF7; border-radius: 8px; padding: 14px; margin-bottom: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
  img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; margin-bottom: 20px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #E0D8CC; font-size: 11px; color: #9A9A88; text-align: right; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${fiche.nom}</h1>
  <div class="meta">
    <span class="badge" style="background:#FEF3E2;color:#B86B1A">${fiche.type === 'plat' ? 'Plat' : fiche.type === 'preparation' ? 'Préparation' : 'Produit'}</span>
    ${fiche.saison ? `<span class="badge" style="background:#E8F5E2;color:#3D7A34">${fiche.saison}</span>` : ''}
    ${allergeneBadges}
  </div>
  ${fiche.image_url ? `<img src="${fiche.image_url}" alt="${fiche.nom}" />` : ''}
  ${fiche.source ? `<p class="source">📖 ${fiche.source}</p>` : ''}

  ${fiche.type === 'plat' ? `
    ${fiche.preparations_libres ? `<h2>Éléments du plat</h2><div class="block">${fiche.preparations_libres}</div>` : ''}
    ${fiche.dressage ? `<h2>Dressage</h2><div class="block">${fiche.dressage}</div>` : ''}
  ` : ''}

  ${fiche.type === 'preparation' ? `
    ${ingredients.length > 0 ? `
      <h2>Ingrédients</h2>
      ${ingredients.map(i => `<div class="ingredient-row"><span class="qty">${i.quantite}${i.unite ? ' ' + i.unite : ''}</span><span>${i.nom}</span></div>`).join('')}
    ` : ''}
    ${etapes.length > 0 ? `
      <h2>Préparation</h2>
      ${etapes.map((e, i) => `<div class="etape"><div class="num">${i + 1}</div><span>${e}</span></div>`).join('')}
    ` : ''}
  ` : ''}

  ${fiche.type === 'produit' ? `
    ${fiche.prix_min != null ? `<h2>Prix</h2><p style="font-size:16px;color:#3D7A34;font-weight:500">💶 ${fiche.prix_min}${fiche.prix_max && fiche.prix_max !== fiche.prix_min ? ' – ' + fiche.prix_max : ''} €/kg</p>` : ''}
    ${fiche.note_libre ? `<h2>Notes</h2><div class="block">${fiche.note_libre}</div>` : ''}
  ` : ''}

  ${fiche.note_perso ? `<h2>Note personnelle</h2><div class="block">${fiche.note_perso}</div>` : ''}

  <div class="footer">Mes Fiches — ${new Date().toLocaleDateString('fr-FR')}</div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
