'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { DATA, SAMPLE_DEALS, COLORS } from '@/lib/data'
import RevChart from '@/components/RevChart'
import { callAI } from '@/lib/api'
import type { DealItem } from '@/lib/types'

interface WinResult {
  name: string
  amount: string
  aiProbability: number
  color: string
}

export default function SalesPage() {
  const { range, serverOk } = useApp()
  const d = DATA[range]
  const [meta, setMeta] = useState<string>('—')
  const [deals, setDeals] = useState<WinResult[]>(
    SAMPLE_DEALS.map(dl => ({ name: dl.name, amount: dl.amount, aiProbability: dl.probability, color: dl.color }))
  )
  const [loadingDeals, setLoadingDeals] = useState(false)

  useEffect(() => {
    setMeta(d.total + ' ' + range)
  }, [range, d])

  useEffect(() => {
    if (!serverOk) return
    setLoadingDeals(true)
    Promise.all(
      SAMPLE_DEALS.map(dl =>
        callAI('win_probability', {
          stage: dl.stage,
          amount: parseInt(dl.amount.replace(/\D/g, '')),
          daysToClose: 30,
          industry: 'SaaS',
          currentProbability: dl.probability,
        }).then(res => ({
          name: dl.name,
          amount: dl.amount,
          aiProbability: res.data.aiProbability ?? dl.probability,
          color: dl.color,
        })).catch(() => ({ name: dl.name, amount: dl.amount, aiProbability: dl.probability, color: dl.color }))
      )
    ).then(results => {
      setDeals(results)
      setLoadingDeals(false)
    })
  }, [serverOk])

  return (
    <div className="chart-row">
      <div className="chart-card aurora">
        <div className="card-header">
          <span className="card-title">Sales Forecast</span>
          <span className="card-meta">{meta}</span>
        </div>
        <RevChart vals={d.rev} labels={d.labels} height={160} />
      </div>

      <div className="chart-card">
        <div className="card-header">
          <span className="card-title">Win Probability</span>
          <span className="card-meta">{loadingDeals ? 'AI scoring…' : 'top deals'}</span>
        </div>
        <div className="funnel-bar-wrap" style={{ padding: '4px 0' }}>
          {deals.map((dl, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{dl.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{dl.amount}</span>
              </div>
              <div className="funnel-item" style={{ marginBottom: 8 }}>
                <div className="funnel-track" style={{ flex: 1 }}>
                  <div
                    className="funnel-fill"
                    style={{ width: `${dl.aiProbability}%`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
                <span className="funnel-count" style={{ width: 40 }}>{dl.aiProbability}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
