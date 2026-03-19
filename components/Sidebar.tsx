'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAVIGATION } from '@/lib/constants'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">Mes Fiches</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAVIGATION.map(section => {
          const hasCats = section.categories.length > 0

          return (
            <div key={section.id} className="sidebar-section">
              {/* Section button */}
              <button
                className="sidebar-section-btn"
                onClick={() => hasCats && toggle(section.id)}
              >
                <span className="sidebar-section-left">
                  <span className="sidebar-section-emoji">{section.emoji}</span>
                  <span>{section.label}</span>
                </span>
                {hasCats && (
                  <span className={`sidebar-chevron${expanded[section.id] ? ' open' : ''}`}>
                    ›
                  </span>
                )}
              </button>

              {/* Produits — no subcats */}
              {!hasCats && (
                <div className="sidebar-categories">
                  <div className={`sidebar-item${isActive('/produits') ? ' active' : ''}`}>
                    <Link href="/produits" className="sidebar-item-link" onClick={onClose}>
                      Toutes les fiches
                    </Link>
                    <Link
                      href="/nouvelle-fiche?type=produit&categorie=produits&section=produits"
                      className="sidebar-add"
                      title="Nouvelle fiche produit"
                    >
                      +
                    </Link>
                  </div>
                </div>
              )}

              {/* Subcategories */}
              {hasCats && expanded[section.id] && (
                <div className="sidebar-categories">
                  {section.categories.map(cat => {
                    const href = `/${section.id}/${cat.slug}`
                    return (
                      <div
                        key={cat.slug}
                        className={`sidebar-item${isActive(href) ? ' active' : ''}`}
                      >
                        <Link href={href} className="sidebar-item-link" onClick={onClose}>
                          {cat.label}
                        </Link>
                        <Link
                          href={`/nouvelle-fiche?type=${section.type}&categorie=${cat.slug}&section=${section.id}`}
                          className="sidebar-add"
                          title={`Nouvelle fiche — ${cat.label}`}
                        >
                          +
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
