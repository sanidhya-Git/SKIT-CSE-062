'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { SAMPLE_VENDORS } from '@/lib/data'
import { callAI } from '@/lib/api'

interface VendorScore {
  name: string
  performanceScore: number
  strengths: string[]
  risks: string[]
  recommendation: string
  totalPOs: number
  onTimePOs: number
  totalSpend: number
}

function scoreColor(s: number) {
  if (s >= 80) return '#30D158'
  if (s >= 60) return '#F0A020'
  return '#FF453A'
}

export default function VendorsPage() {
  const { serverOk } = useApp()
  const [vendors, setVendors] = useState<VendorScore[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function loadVendors() {
    setLoading(true)
    const results = await Promise.all(
      SAMPLE_VENDORS.map(async v => {
        try {
          const res = await callAI('vendor_scorecard', v)
          return {
            name: v.name,
            performanceScore: res.data.performanceScore ?? v.currentScore,
            strengths: res.data.strengths ?? [],
            risks: res.data.risks ?? [],
            recommendation: res.data.recommendation ?? '',
            totalPOs: v.totalPOs,
            onTimePOs: v.onTimePOs,
            totalSpend: v.totalSpend,
          }
        } catch {
          return {
            name: v.name,
            performanceScore: v.currentScore,
            strengths: [],
            risks: [],
            recommendation: 'AI engine offline — showing static score.',
            totalPOs: v.totalPOs,
            onTimePOs: v.onTimePOs,
            totalSpend: v.totalSpend,
          }
        }
      })
    )
    setVendors(results)
    setLoading(false)
    setLoaded(true)
  }

  return (
    <div className="chart-card">
      <div className="card-header">
        <span className="card-title">Vendor Scorecards</span>
        <button className="btn primary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={loadVendors} disabled={loading}>
          {loading ? <><span className="spinner" /> Scoring…</> : 'Refresh AI Scores'}
        </button>
      </div>

      {!loaded && !loading && (
        <div style={{ color: 'var(--text-3)', fontSize: 12 }}>
          Click &quot;Refresh AI Scores&quot; to evaluate vendor performance with AI.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: loaded ? 4 : 0 }}>
        {vendors.map((v, i) => (
          <div className="vendor-card" key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="vendor-name">{v.name}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(v.performanceScore) }}>
                {v.performanceScore}
              </span>
            </div>
            <div className="vendor-meta">
              {v.totalPOs} POs · {v.onTimePOs} on-time ({Math.round(v.onTimePOs / v.totalPOs * 100)}%) ·
              ${(v.totalSpend / 1000).toFixed(0)}k spend
            </div>
            <div className="vendor-score-bar">
              <div
                className="vendor-score-fill"
                style={{ width: `${v.performanceScore}%`, background: scoreColor(v.performanceScore) }}
              />
            </div>
            {v.recommendation && (
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 4 }}>
                {v.recommendation}
              </div>
            )}
            {(v.strengths.length > 0 || v.risks.length > 0) && (
              <div className="vendor-tags">
                {v.strengths.slice(0, 2).map((s, j) => (
                  <span key={j} className="vendor-tag" style={{ background: 'rgba(48,209,88,0.1)', color: 'var(--green)' }}>
                    ✓ {s}
                  </span>
                ))}
                {v.risks.slice(0, 1).map((r, j) => (
                  <span key={j} className="vendor-tag" style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--red)' }}>
                    ⚠ {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
