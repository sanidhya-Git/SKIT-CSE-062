'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const NAV = [
  {
    href: '/overview', label: 'Overview',
    icon: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  },
  {
    href: '/leads', label: 'Leads',
    icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 100 6A3 3 0 008 1zM3 12c0-2.21 2.24-4 5-4s5 1.79 5 4v1H3v-1z"/></svg>,
  },
  {
    href: '/support', label: 'Support',
    icon: <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2.5"/></svg>,
  },
  {
    href: '/sales', label: 'Sales',
    icon: <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 11l3-4 3 2 3-5 3 3v4H2z"/><rect x="1" y="13" width="14" height="1.5" rx=".75"/></svg>,
  },
  {
    href: '/vendors', label: 'Vendors',
    icon: <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="8" width="3" height="6" rx="1"/><rect x="6.5" y="5" width="3" height="9" rx="1"/><rect x="11" y="2" width="3" height="12" rx="1"/></svg>,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { chatOpen, setChatOpen, setScorerOpen } = useApp()

  return (
    <nav className="sidebar">
      <div className="sidebar-section-label">Workspace</div>
      {NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item${pathname === item.href ? ' active' : ''}`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}

      <div className="sidebar-section-label">AI Tools</div>
      <button className="nav-item" onClick={() => setScorerOpen(true)}>
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.3l-3.7 1.9.7-4.1-3-2.9 4.2-.7z"/>
        </svg>
        Lead Scorer
      </button>
      <button className="nav-item" onClick={() => setChatOpen(!chatOpen)}>
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 2V3a1 1 0 011-1z"/>
        </svg>
        AI Chat
      </button>

      <div className="nav-spacer" />
      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--blue)' }}>
            <circle cx="8" cy="8" r="7"/>
          </svg>
          OneOps v2.0
        </div>
      </div>
    </nav>
  )
}
