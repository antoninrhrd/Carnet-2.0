'use client'

import { useState } from 'react'
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
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            ☰
          </button>
          <span className="mobile-title">Mes Fiches</span>
        </div>

        <div className="content-inner">{children}</div>
      </div>
    </div>
  )
}
