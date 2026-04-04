'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ALLERGENES } from '@/lib/constants'
import { useState } from 'react'

export default function AllergenFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('sans') || ''
  const [open, setOpen] = useState(false)

  const activeAllergene = ALLERGENES.find(a => a.slug === current)

  function setSans(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === current) params.delete('sans')
    else params.set('sans', slug)
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div style={{ marginBottom: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Sans allergène :
        </span>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: '5px 14px',
            borderRadius: 20,
            border: `1px solid ${activeAllergene ? activeAllergene.color : 'var(--border)'}`,
            background: activeAllergene ? activeAllergene.bg : 'transparent',
            color: activeAllergene ? activeAllergene.color : 'var(--text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: activeAllergene ? 600 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {activeAllergene ? (
            <>{activeAllergene.emoji} Sans {activeAllergene.label} <span style={{ opacity: 0.6, fontSize: 12 }}>▾</span></>
          ) : (
            <>Choisir ▾</>
          )}
        </button>
        {activeAllergene && (
          <button
            onClick={() => setSans('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 6,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 12,
          zIndex: 50,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          maxWidth: 480,
        }}>
          {ALLERGENES.map(a => {
            const active = current === a.slug
            return (
              <button
                key={a.slug}
                onClick={() => setSans(a.slug)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: `1.5px solid ${active ? a.color : 'var(--border)'}`,
                  background: active ? a.bg : '#FAFAF7',
                  color: active ? a.color : 'var(--text-secondary)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{a.emoji}</span>
                <span>{a.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
