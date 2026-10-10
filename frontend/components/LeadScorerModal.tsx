'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { callAI } from '@/lib/api'

interface ScoreResult {
  score: number
  reason: string
}

export default function LeadScorerModal() {
  const { scorerOpen, setScorerOpen } = useApp()
  const [form, setForm] = useState({ name: '', company: '', industry: '', budget: '', notes: '' })
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function runScorer() {
    if (!form.name || !form.company) {
      setError('Name and company are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await callAI('score_lead', {
        leadName: form.name,
        company: form.company,
        industry: form.industry,
        budget: form.budget,
        notes: form.notes,
      })
      setResult({ score: res.data.score, reason: res.data.reason })
    } catch {
      setError('AI engine is offline or an error occurred.')
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setScorerOpen(false)
    setResult(null)
    setError('')
    setForm({ name: '', company: '', industry: '', budget: '', notes: '' })
  }

  function scoreColor(s: number) {
    if (s >= 70) return 'var(--green)'
    if (s >= 40) return 'var(--amber)'
    return 'var(--red)'
  }

  return (
    <div className={`overlay${scorerOpen ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">AI Lead Scorer</span>
          <button className="modal-close" onClick={close}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Lead Name</label>
              <input className="field-input" placeholder="Sarah Johnson" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Company</label>
              <input className="field-input" placeholder="Acme Corp" value={form.company} onChange={e => update('company', e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Industry</label>
              <input className="field-input" placeholder="SaaS / FinTech…" value={form.industry} onChange={e => update('industry', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Budget</label>
              <input className="field-input" placeholder="$50k ARR" value={form.budget} onChange={e => update('budget', e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Notes / Context</label>
            <input className="field-input" placeholder="Met at SaaStr, wants enterprise plan…" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>}
          {result && (
            <div className="score-result">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="score-num" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                <span className="score-label">/ 100 AI Score</span>
              </div>
              <div className="score-reason">{result.reason}</div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={close}>Cancel</button>
          <button className="btn primary" onClick={runScorer} disabled={loading}>
            {loading ? <><span className="spinner" /> Scoring…</> : 'Score Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
