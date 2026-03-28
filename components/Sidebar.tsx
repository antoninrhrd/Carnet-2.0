'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAVIGATION } from '@/lib/constants'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  counts: Record<string, number>
}

export default function Sidebar({ isOpen, onClose, counts }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    plats: true,
    preparations: true,
    produits: true,
  })

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const isActive = (href: string) => pathname === href

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <Link href="/" style={{ textDecoration: 'none' }} onClick={onClose}>
          <span className="sidebar-title">Mes Fiches</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAVIGATION.map(section => {
          const hasCats = section.categories.length > 0
          const sectionCount = hasCats
            ? section.categories.reduce((sum, cat) => sum + (counts[`${section.type}_${cat.slug}`] || 0), 0)
            : (counts[`produit_produits`] || 0)

          return (
            <div key={section.id} className="sidebar-section">
              <button
                className="sidebar-section-btn"
                onClick={() => hasCats && toggle(section.id)}
              >
                <span className="sidebar-section-left">
                  <span className="sidebar-section-emoji">{section.emoji}</span>
                  <span>{section.label}</span>
                  {sectionCount > 0 && (
                    <span className="sidebar-count-badge">{sectionCount}</span>
                  )}
                </span>
                {hasCats && (
                  <span className={`sidebar-chevron${expanded[section.id] ? ' open' : ''}`}>›</span>
                )}
              </button>

              {!hasCats && (
                <div className="sidebar-categories">
                  <div className={`sidebar-item${isActive('/produits') ? ' active' : ''}`}>
                    <Link href="/produits" className="sidebar-item-link" onClick={onClose}>
                      Toutes les fiches
                    </Link>
                    <Link href="/nouvelle-fiche?type=produit&categorie=produits&section=produits" className="sidebar-add" title="Nouvelle fiche produit">+</Link>
                  </div>
                </div>
              )}

              {hasCats && expanded[section.id] && (
                <div className="sidebar-categories">
                  {section.categories.map(cat => {
                    const href = `/${section.id}/${cat.slug}`
                    const count = counts[`${section.type}_${cat.slug}`] || 0
                    return (
                      <div key={cat.slug} className={`sidebar-item${isActive(href) ? ' active' : ''}`}>
                        <Link href={href} className="sidebar-item-link" onClick={onClose}>{cat.label}</Link>
                        {count > 0 && <span className="sidebar-count">{count}</span>}
                        <Link href={`/nouvelle-fiche?type=${section.type}&categorie=${cat.slug}&section=${section.id}`} className="sidebar-add" title={`Nouvelle fiche — ${cat.label}`}>+</Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Import photo — visible sur desktop ET mobile */}
      <div style={{ padding: '12px 12px 24px', borderTop: '1px solid var(--sidebar-border)', marginTop: 'auto' }}>
        <Link
          href="/import-photo"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.07)',
            textDecoration: 'none',
            color: 'var(--sidebar-text)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13.5,
            transition: 'background 0.15s',
          }}
        >
          <span style={{ fontSize: 16 }}>📷</span>
          <span>Importer depuis photo</span>
        </Link>
      </div>
    </aside>
  )
}
