'use client'

import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import type { Range } from '@/lib/types'

const TITLES: Record<string, string> = {
  '/overview': 'Overview',
  '/leads': 'Leads',
  '/support': 'Support',
  '/sales': 'Sales',
  '/vendors': 'Vendors',
}

const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
]

export default function Topbar() {
  const pathname = usePathname()
  const { range, setRange } = useApp()

  return (
    <div className="topbar">
      <span className="page-title">{TITLES[pathname] ?? 'Dashboard'}</span>
      <div className="topbar-actions">
        <div className="range-pills">
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`range-pill${range === r.key ? ' active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
