'use client'

import { ALLERGENES, ALLERGENE_STYLE } from '@/lib/constants'

interface Props {
  selected: string[]
  onChange: (vals: string[]) => void
}

export default function AllergenSelector({ selected, onChange }: Props) {
  function toggle(a: string) {
    if (selected.includes(a)) onChange(selected.filter(s => s !== a))
    else onChange([...selected, a])
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
        Cochez les allergènes présents dans cette fiche.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        {ALLERGENES.map(a => {
          const active = selected.includes(a)
          const style = ALLERGENE_STYLE[a]
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: `2px solid ${active ? style.color : 'var(--border)'}`,
                background: active ? style.bg : 'transparent',
                color: active ? style.color : 'var(--text-secondary)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {a === 'Gluten' ? '🌾 ' : '🥛 '}{a}
            </button>
          )
        })}
      </div>
    </div>
  )
}
