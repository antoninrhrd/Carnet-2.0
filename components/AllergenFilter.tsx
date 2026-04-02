'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ALLERGENES } from '@/lib/constants'

export default function AllergenFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('allergene') || ''

  function setAllergene(a: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (a === current) params.delete('allergene')
    else params.set('allergene', a)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Allergènes :</span>
      {ALLERGENES.map(a => (
        <button
          key={a}
          className={`season-btn${current === a ? ' active' : ''}`}
          onClick={() => setAllergene(a)}
        >
          {a === 'Gluten' ? '🌾 ' : '🥛 '}{a}
        </button>
      ))}
    </div>
  )
}
