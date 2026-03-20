'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NAVIGATION } from '@/lib/constants'

export default function ChoisirTypePage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  const section = NAVIGATION.find(s => s.type === selectedType)

  function handleType(type: string) {
    setSelectedType(type)
    setSelectedCat(null)
    if (type === 'produit') {
      router.push('/nouvelle-fiche?type=produit&categorie=produits&section=produits')
    }
  }

  function handleGo() {
    if (!selectedType || !selectedCat) return
    const sectionId = NAVIGATION.find(s => s.type === selectedType)?.id || selectedType
    router.push(`/nouvelle-fiche?type=${selectedType}&categorie=${selectedCat}&section=${sectionId}`)
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Link href="/" className="detail-back">← Retour</Link>
      <h1 className="form-title" style={{ marginBottom: 6 }}>Nouvelle fiche</h1>
      <p className="form-subtitle" style={{ marginBottom: 28 }}>Quel type de fiche souhaitez-vous créer ?</p>

      <div className="form-section">
        <h2 className="form-section-title">Type</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {NAVIGATION.map(s => (
            <button
              key={s.type}
              onClick={() => handleType(s.type)}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '14px 16px',
                borderRadius: 10,
                border: `2px solid ${selectedType === s.type ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedType === s.type ? 'var(--accent-light)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13.5,
                fontWeight: selectedType === s.type ? 500 : 400,
                color: selectedType === s.type ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedType && selectedType !== 'produit' && section && section.categories.length > 0 && (
        <div className="form-section">
          <h2 className="form-section-title">Sous-catégorie</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {section.categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCat(cat.slug)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${selectedCat === cat.slug ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedCat === cat.slug ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: selectedCat === cat.slug ? 500 : 400,
                  color: selectedCat === cat.slug ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {selectedCat && (
            <div style={{ marginTop: 20 }}>
              <button className="btn-primary" onClick={handleGo} style={{ fontSize: 15, padding: '11px 24px' }}>
                Créer la fiche →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
