'use client'

import { ALLERGENES } from '@/lib/constants'

interface Props {
  selected: string[]
  onChange: (vals: string[]) => void
}

export default function AllergenSelector({ selected, onChange }: Props) {
  function toggle(slug: string) {
    if (selected.includes(slug)) onChange(selected.filter(s => s !== slug))
    else onChange([...selected, slug])
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        Cochez les allergènes <strong>présents</strong> dans cette fiche.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ALLERGENES.map(a => {
          const active = selected.includes(a.slug)
          return (
            <button
              key={a.slug}
              type="button"
              onClick={() => toggle(a.slug)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `2px solid ${active ? a.color : 'var(--border)'}`,
                background: active ? a.bg : 'transparent',
                color: active ? a.color : 'var(--text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>{a.emoji}</span>
              <span>{a.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

