'use client'

import { useEffect, useState } from 'react'
import type { PreparationSummary } from '@/lib/types'
import { NAVIGATION } from '@/lib/constants'

interface Props {
  selected: string[]
  onChange: (ids: string[]) => void
}

const CAT_LABEL: Record<string, string> = {}
NAVIGATION.find(s => s.id === 'preparations')?.categories.forEach(c => {
  CAT_LABEL[c.slug] = c.label
})

export default function PreparationSelector({ selected, onChange }: Props) {
  const [preparations, setPreparations] = useState<PreparationSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/preparations', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { setPreparations(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id))
    else onChange([...selected, id])
  }

  const filtered = search.trim()
    ? preparations.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()))
    : preparations

  // Group by categorie
  const grouped = filtered.reduce<Record<string, PreparationSummary[]>>((acc, p) => {
    if (!acc[p.categorie]) acc[p.categorie] = []
    acc[p.categorie].push(p)
    return acc
  }, {})

  const selectedPreps = preparations.filter(p => selected.includes(p.id))

  return (
    <div>
      {/* Selected pills */}
      {selectedPreps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {selectedPreps.map(p => (
            <span
              key={p.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                border: '1px solid rgba(196,98,45,0.25)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 13,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500,
              }}
            >
              {p.nom}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontSize: 15,
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        className="field-input"
        placeholder="Rechercher une préparation…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      {/* List */}
      <div style={{
        maxHeight: 220,
        overflowY: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: '#FAFAF7',
      }}>
        {loading && (
          <p style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>Chargement…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
            {search ? 'Aucun résultat' : 'Aucune préparation enregistrée'}
          </p>
        )}
        {!loading && Object.entries(grouped).map(([cat, preps]) => (
          <div key={cat}>
            <div style={{
              padding: '8px 14px 4px',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'DM Sans, sans-serif',
              borderTop: '1px solid var(--border)',
            }}>
              {CAT_LABEL[cat] || cat}
            </div>
            {preps.map(p => {
              const isSelected = selected.includes(p.id)
              return (
                <div
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-light)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? 'var(--accent-light)' : 'transparent' }}
                >
                  <span style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.12s',
                  }}>
                    {isSelected && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </span>
                  <span style={{
                    fontSize: 13.5,
                    fontFamily: 'DM Sans, sans-serif',
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 500 : 400,
                  }}>
                    {p.nom}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
