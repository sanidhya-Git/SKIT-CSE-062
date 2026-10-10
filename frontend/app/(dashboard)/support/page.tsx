'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { DATA } from '@/lib/data'
import StatCard from '@/components/StatCard'
import SupChart from '@/components/SupChart'
import { callAI } from '@/lib/api'

interface TicketAnalysis {
  sentiment: string
  suggestion: string
  agentNote: string
}

const SAMPLE_TICKET = {
  subject: 'Unable to access dashboard after recent update',
  description: 'Since the v2.3 update deployed yesterday, our entire team cannot log into the admin dashboard. We get a 403 error. This is blocking our operations completely.',
  category: 'Technical Issue',
  priority: 'Critical',
}

function sentimentColor(s: string) {
  const map: Record<string, string> = { Positive: 'var(--green)', Neutral: 'var(--blue)', Negative: 'var(--amber)', Frustrated: 'var(--red)' }
  return map[s] || 'var(--text-2)'
}

export default function SupportPage() {
  const { range } = useApp()
  const d = DATA[range]
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyse() {
    setLoading(true)
    try {
      const res = await callAI('analyse_ticket', SAMPLE_TICKET)
      setAnalysis(res.data as TicketAnalysis)
    } catch {
      setAnalysis({ sentiment: 'Error', suggestion: 'Could not reach AI engine.', agentNote: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="stat-row">
        <StatCard label="Critical" value={d.sup.critical} sub="Urgent tickets" badge="urgent" badgeClass="badge-down" valueColor="var(--red)" />
        <StatCard label="High" value={d.sup.high} sub="Today" badge="today" badgeClass="badge-neutral" valueColor="var(--amber)" />
        <StatCard label="Medium" value={d.sup.medium} sub="Today" badge="today" badgeClass="badge-neutral" valueColor="var(--blue)" />
        <StatCard label="Low" value={d.sup.low} sub="Today" badge="today" badgeClass="badge-up" valueColor="var(--green)" />
      </div>

      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">Ticket Distribution</span>
          <span className="card-meta">by priority</span>
        </div>
        <SupChart data={d.sup} height={180} />
      </div>

      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">AI Ticket Analysis</span>
          <button className="btn primary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={analyse} disabled={loading}>
            {loading ? <><span className="spinner" /> Analysing…</> : 'Analyse Sample Ticket'}
          </button>
        </div>
        {!analysis && !loading && (
          <div style={{ color: 'var(--text-3)', fontSize: 12, padding: '4px 0' }}>
            Click &quot;Analyse Sample Ticket&quot; to get AI insights on a support ticket.
          </div>
        )}
        {analysis && (
          <div className="insights-list">
            <div className="insight-item">
              <div className="insight-dot" style={{ background: sentimentColor(analysis.sentiment) }} />
              <span className="insight-text"><strong>Sentiment:</strong> {analysis.sentiment}</span>
            </div>
            <div className="insight-item">
              <div className="insight-dot" style={{ background: 'var(--blue)' }} />
              <span className="insight-text"><strong>Suggestion:</strong> {analysis.suggestion}</span>
            </div>
            {analysis.agentNote && (
              <div className="insight-item">
                <div className="insight-dot" style={{ background: 'var(--purple)' }} />
                <span className="insight-text"><strong>Agent Note:</strong> {analysis.agentNote}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
