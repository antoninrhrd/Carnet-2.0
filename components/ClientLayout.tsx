'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Mobile top bar */}
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
