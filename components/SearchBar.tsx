'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') || '')

  const updateSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term.trim()) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    updateSearch(e.target.value)
  }

  function handleClear() {
    setValue('')
    updateSearch('')
  }

  return (
    <div style={{ position: 'relative', marginBottom: 16, width: '100%', maxWidth: 480 }}>
      <span style={{
        position: 'absolute',
        left: 13,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 16,
        opacity: 0.4,
        pointerEvents: 'none',
        zIndex: 1,
      }}>🔍</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Rechercher une fiche…"
        className="field-input"
        style={{ paddingLeft: 38, paddingRight: value ? 36 : 13, width: '100%', boxSizing: 'border-box' }}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--text-muted)',
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
