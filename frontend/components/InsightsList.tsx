'use client'

import { useState, useEffect } from 'react'
import { callAI } from '@/lib/api'
import { STATIC_INSIGHTS, COLORS } from '@/lib/data'
import { useApp } from '@/context/AppContext'
import { DATA } from '@/lib/data'
import type { Insight } from '@/lib/types'

export default function InsightsList() {
  const { range, serverOk } = useApp()
  const [insights, setInsights] = useState<Insight[]>(STATIC_INSIGHTS)
  const [status, setStatus] = useState('static')

  useEffect(() => {
    setInsights(STATIC_INSIGHTS)
    setStatus('static')
    if (!serverOk) return

    setStatus('AI loading…')
    const d = DATA[range]
    callAI('summarize', {
      text: `Revenue: ${d.total}, Active Leads: ${d.leads}, Open Tickets: ${d.tickets}, Win Rate: ${d.win}. Provide 3 brief actionable business insights in plain text, one per line.`,
    })
      .then(res => {
        const text = (res.data?.summary || '').trim()
        if (text.length > 20) {
          const parts = (text as string)
            .split('\n')
            .filter((l: string) => l.trim().length > 10)
            .slice(0, 4)
          setInsights(parts.map((p: string, i: number) => ({
            text: p.replace(/^[\d.\-*\s]+/, ''),
            color: COLORS[i % COLORS.length],
          })))
          setStatus('AI generated')
        }
      })
      .catch(() => setStatus('static'))
  }, [range, serverOk])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="card-title">AI Insights</span>
        <span className="card-meta">{status}</span>
      </div>
      <div className="insights-list">
        {insights.map((ins, i) => (
          <div className="insight-item" key={i}>
            <div className="insight-dot" style={{ background: ins.color }} />
            <span className="insight-text">{ins.text}</span>
          </div>
        ))}
      </div>
    </>
  )
}
