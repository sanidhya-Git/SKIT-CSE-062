'use client'

import { useApp } from '@/context/AppContext'
import { DATA } from '@/lib/data'
import FunnelBars from '@/components/FunnelBars'

export default function LeadsPage() {
  const { range, setScorerOpen } = useApp()
  const d = DATA[range]

  return (
    <div className="chart-row">
      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">Lead Funnel</span>
          <span className="card-meta">{d.funnel[0].val.toLocaleString()} total</span>
        </div>
        <FunnelBars items={d.funnel} />
      </div>
      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">AI Lead Scoring</span>
          <button
            className="btn primary"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => setScorerOpen(true)}
          >
            Score a Lead
          </button>
        </div>
        <div className="insights-list">
          <div className="insight-item">
            <div className="insight-dot" style={{ background: 'var(--blue)' }} />
            <span className="insight-text">
              Click &quot;Score a Lead&quot; to evaluate any prospect with AI — get a 0–100 score and actionable reasoning.
            </span>
          </div>
          <div className="insight-item">
            <div className="insight-dot" style={{ background: 'var(--green)' }} />
            <span className="insight-text">
              AI scoring considers industry, budget, urgency, company size, and context clues to predict conversion likelihood.
            </span>
          </div>
          <div className="insight-item">
            <div className="insight-dot" style={{ background: 'var(--amber)' }} />
            <span className="insight-text">
              Scores 70+ are hot leads. 40–69 are warm. Below 40 need nurturing before outreach.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
