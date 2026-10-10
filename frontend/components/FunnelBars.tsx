'use client'

import { useEffect, useRef } from 'react'
import { COLORS } from '@/lib/data'
import type { FunnelItem } from '@/lib/types'

interface FunnelBarsProps {
  items: FunnelItem[]
  metaId?: string
}

function fmt(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
}

export default function FunnelBars({ items }: FunnelBarsProps) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const total = items[0]?.val ?? 1

  useEffect(() => {
    const timers = refs.current.map((el, i) => {
      if (!el) return null
      const pct = Math.round((items[i].val / total) * 100)
      return setTimeout(() => {
        if (el) el.style.width = `${pct}%`
      }, 60 + i * 80)
    })
    return () => timers.forEach(t => t && clearTimeout(t))
  }, [items, total])

  return (
    <div className="funnel-bar-wrap">
      {items.map((item, i) => (
        <div className="funnel-item" key={item.label}>
          <span className="funnel-label">{item.label}</span>
          <div className="funnel-track">
            <div
              ref={el => { refs.current[i] = el }}
              className="funnel-fill"
              style={{ width: '0%', background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="funnel-count">{fmt(item.val)}</span>
        </div>
      ))}
    </div>
  )
}
