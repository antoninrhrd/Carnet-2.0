'use client'

import { useState } from 'react'
import Link from 'next/link'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
  counts: Record<string, number>
}

export default function ClientLayout({ children, counts }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} counts={counts} />

      <div className="main-content">
        <div className="mobile-top">
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">☰</button>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="mobile-title" style={{ color: '#FFFFFF', fontFamily: 'Cormorant Garamond, serif' }}>
              Mes Fiches
            </span>
          </Link>
          <Link
            href="/import-photo"
            style={{ color: 'white', textDecoration: 'none', fontSize: 22, marginLeft: 'auto', padding: '0 4px' }}
            title="Importer depuis photo"
          >
            📷
          </Link>
        </div>
        <div className="content-inner">{children}</div>
      </div>
    </div>
  )
}
