'use client'

import { useApp } from '@/context/AppContext'
import { DATA } from '@/lib/data'
import StatCard from '@/components/StatCard'
import RevChart from '@/components/RevChart'
import SupChart from '@/components/SupChart'
import FunnelBars from '@/components/FunnelBars'
import InsightsList from '@/components/InsightsList'
import ActivityFeed from '@/components/ActivityFeed'

export default function OverviewPage() {
  const { range } = useApp()
  const d = DATA[range]

  return (
    <>
      <div className="stat-row">
        <StatCard label="Revenue" value={d.total} sub={`Revenue ${range}`} badge={d.revDelta} badgeClass="badge-up" />
        <StatCard label="Active Leads" value={d.leads.toLocaleString()} sub="Active pipeline" badge={d.leadsDelta} badgeClass="badge-up" />
        <StatCard
          label="Tickets Open"
          value={d.tickets.toLocaleString()}
          sub="Open tickets"
          badge={d.tickets > 100 ? 'High' : 'Normal'}
          badgeClass="badge-neutral"
        />
        <StatCard label="Win Rate" value={d.win} sub="Close rate" badge={d.winDelta} badgeClass="badge-up" />
      </div>

      <div className="chart-row">
        <div className="chart-card aurora">
          <div className="card-header">
            <span className="card-title">Revenue Trend</span>
            <span className="card-meta">{d.total} {range}</span>
          </div>
          <RevChart vals={d.rev} labels={d.labels} height={160} />
        </div>
        <div className="chart-card">
          <div className="card-header">
            <span className="card-title">Support Load</span>
            <span className="card-meta">by priority</span>
          </div>
          <SupChart data={d.sup} height={160} />
        </div>
      </div>

      <div className="funnel-row">
        <div className="chart-card">
          <div className="card-header">
            <span className="card-title">Lead Funnel</span>
            <span className="card-meta">{d.funnel[0].val.toLocaleString()} total</span>
          </div>
          <FunnelBars items={d.funnel} />
        </div>
        <div className="chart-card">
          <InsightsList />
        </div>
      </div>

      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <span className="card-meta">live</span>
        </div>
        <ActivityFeed />
      </div>
    </>
  )
}
