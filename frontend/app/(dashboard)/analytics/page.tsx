'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { analyticsApi, aiApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { MetricCard } from '@/components/analytics/MetricCard';
import { WorkflowChart } from '@/components/analytics/WorkflowChart';
import { AIUsageTable } from '@/components/analytics/AIUsageTable';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { AnalyticsData, AIUsageSummary } from '@/lib/types';
import { formatCurrency, formatDuration, formatNumber, formatPercent } from '@/lib/utils';

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();

  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const [analyticsData, usageData] = await Promise.all([
        analyticsApi.get(token, orgId, { period }),
        aiApi.getUsage(token, orgId),
      ]);
      setAnalytics(analyticsData);
      setAiUsage(usageData);
    } catch {
      setError('Could not load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSpinner message="Loading analytics…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const runs = analytics?.runs;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Reporting</div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Workflow performance and AI usage</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid',
                  borderColor: period === p.value ? 'var(--accent)' : 'var(--border)',
                  background: period === p.value ? 'var(--accent-dim)' : 'transparent',
                  color: period === p.value ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition)',
                }}
                aria-pressed={period === p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard
          label="Total runs"
          value={formatNumber(runs?.total ?? 0)}
          icon="▶"
        />
        <MetricCard
          label="Completed"
          value={formatNumber(runs?.completed ?? 0)}
          icon="✓"
          accentColor="var(--success)"
        />
        <MetricCard
          label="Failed"
          value={formatNumber(runs?.failed ?? 0)}
          icon="✕"
          accentColor={
            (runs?.failed ?? 0) > 0 ? 'var(--danger)' : undefined
          }
        />
        <MetricCard
          label="Success rate"
          value={runs ? formatPercent(runs.successRate) : '—'}
          icon="◎"
          accentColor={
            runs && runs.successRate >= 90
              ? 'var(--success)'
              : runs && runs.successRate >= 70
              ? 'var(--warning)'
              : 'var(--danger)'
          }
        />
        <MetricCard
          label="Avg. duration"
          value={formatDuration(runs?.avgDurationMs)}
          icon="⏱"
        />
        <MetricCard
          label="AI spend"
          value={formatCurrency(aiUsage?.totalCost ?? 0)}
          icon="◆"
        />
      </div>

      {/* Run chart */}
      <Card style={{ marginBottom: '1.25rem' }}>
        <CardHeader
          title="Run volume"
          subtitle="Completed vs failed runs by day"
        />
        <CardBody>
          <WorkflowChart data={analytics?.runsByDay ?? []} height={200} />
        </CardBody>
      </Card>

      {/* Top workflows + AI usage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
        }}
      >
        {/* Top workflows table */}
        <Card>
          <CardHeader
            title="Top workflows"
            subtitle="By run volume"
          />
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Runs</th>
                  <th>Success rate</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.topWorkflows ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '2rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      No workflow data yet.
                    </td>
                  </tr>
                ) : (
                  (analytics?.topWorkflows ?? []).map(w => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 500 }}>{w.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                        {formatNumber(w.runs)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.875rem',
                            color:
                              w.successRate >= 90
                                ? 'var(--success)'
                                : w.successRate >= 70
                                ? 'var(--warning)'
                                : 'var(--danger)',
                          }}
                        >
                          {formatPercent(w.successRate)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI usage */}
        <Card>
          <CardHeader
            title="AI usage"
            subtitle={`${formatNumber(aiUsage?.totalTokens ?? 0)} tokens · ${formatCurrency(aiUsage?.totalCost ?? 0)}`}
          />
          <AIUsageTable records={(aiUsage?.records ?? []).slice(0, 10)} />
        </Card>
      </div>
    </div>
  );
}
