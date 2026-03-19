'use client'

import { useState } from 'react'
import type { Ingredient } from '@/lib/types'

interface Props {
  ingredients: Ingredient[]
}

function scaleQuantity(quantite: string, factor: number): string {
  if (!quantite || quantite.trim() === '') return quantite
  // Try to parse a number from the quantity string
  const match = quantite.match(/^(\d+([.,]\d+)?)(.*)$/)
  if (!match) return quantite
  const num = parseFloat(match[1].replace(',', '.'))
  const rest = match[3]
  const result = num * factor
  // Format nicely: remove trailing zeros
  const formatted = Number.isInteger(result)
    ? result.toString()
    : result.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
  return formatted + rest
}

const PRESETS = [
  { label: '×½', value: 0.5 },
  { label: '×1', value: 1 },
  { label: '×2', value: 2 },
  { label: '×3', value: 3 },
  { label: '×4', value: 4 },
]

export default function IngredientScaler({ ingredients }: Props) {
  const [factor, setFactor] = useState(1)
  const [custom, setCustom] = useState('')

  function applyCustom() {
    const val = parseFloat(custom.replace(',', '.'))
    if (!isNaN(val) && val > 0) {
      setFactor(val)
      setCustom('')
    }
  }

  return (
    <div>
      {/* Multiplier controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Coefficient
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setFactor(p.value)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${factor === p.value ? 'var(--accent)' : 'var(--border)'}`,
                background: factor === p.value ? 'var(--accent)' : 'transparent',
                color: factor === p.value ? 'white' : 'var(--text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Custom input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>×</span>
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustom()}
            placeholder="autre"
            style={{
              width: 60,
              padding: '4px 8px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
              outline: 'none',
              background: '#FAFAF7',
            }}
          />
          <button
            onClick={applyCustom}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            OK
          </button>
        </div>
        {factor !== 1 && (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'DM Sans, sans-serif' }}>
            ×{factor % 1 === 0 ? factor : factor.toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>

      {/* Ingredient list */}
      <ul className="ingredient-list">
        {ingredients.map((ing, i) => (
          <li key={ing.id || i} className="ingredient-item">
            <span className="ingredient-qty">
              {ing.quantite ? scaleQuantity(ing.quantite, factor) : ''}
              {ing.unite ? ` ${ing.unite}` : ''}
            </span>
            <span>{ing.nom}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

