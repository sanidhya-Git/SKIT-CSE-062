'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsApi, approvalsApi, integrationsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { MetricCard } from '@/components/analytics/MetricCard';
import { WorkflowChart } from '@/components/analytics/WorkflowChart';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RunStatusBadge } from '@/components/workflow/RunStatusBadge';
import type { AnalyticsData, Approval, Integration } from '@/lib/types';
import { formatDuration, formatPercent, formatRelativeTime } from '@/lib/utils';

export default function OverviewPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !orgId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const [analyticsData, approvalsData, integrationsData] = await Promise.all([
        analyticsApi.get(token, orgId, { period: '7d' }),
        approvalsApi.list(token, orgId, { status: 'pending', pageSize: 5 }),
        integrationsApi.list(token, orgId),
      ]);
      setAnalytics(analyticsData);
      setApprovals(approvalsData.data);
      setIntegrations(integrationsData);
    } catch (err) {
      setError('Could not load dashboard data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSpinner message="Loading overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const runs = analytics?.runs;
  const workflows = analytics?.workflows;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Dashboard</div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Last 7 days across all workflows</p>
        </div>
        <div className="page-actions">
          <Link href="/workflows/new">
            <Button variant="primary" size="md">
              + New workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        <MetricCard
          label="Workflow runs"
          value={runs?.total ?? 0}
          icon="▶"
          trend={runs?.total ? { value: 12, direction: 'up' } : undefined}
        />
        <MetricCard
          label="Success rate"
          value={runs ? formatPercent(runs.successRate) : '—'}
          icon="✓"
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
          label="Pending approvals"
          value={analytics?.approvals?.pending ?? 0}
          icon="✓"
          accentColor={
            (analytics?.approvals?.pending ?? 0) > 0 ? 'var(--warning)' : undefined
          }
        />
        <MetricCard
          label="Active workflows"
          value={workflows?.published ?? 0}
          icon="⬡"
        />
        <MetricCard
          label="Integrations"
          value={`${analytics?.integrations?.healthy ?? 0} / ${analytics?.integrations?.total ?? 0}`}
          icon="⚙"
          accentColor={
            (analytics?.integrations?.down ?? 0) > 0 ? 'var(--danger)' : 'var(--success)'
          }
        />
      </div>

      {/* Charts + widgets row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Run activity chart */}
        <Card>
          <CardHeader
            title="Run activity"
            subtitle="Completed vs failed per day"
            actions={
              <Link href="/runs" style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}>
                View all →
              </Link>
            }
          />
          <CardBody>
            <WorkflowChart data={analytics?.runsByDay ?? []} />
          </CardBody>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader
            title="Pending approvals"
            subtitle={`${approvals.length} waiting`}
            actions={
              <Link href="/approvals" style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}>
                All →
              </Link>
            }
          />
          <CardBody style={{ padding: 0 }}>
            {approvals.length === 0 ? (
              <EmptyState
                icon="✓"
                title="All clear"
                description="No approvals are waiting right now."
              />
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {approvals.map(a => (
                  <li
                    key={a.id}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.stepName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.workflowName} · {formatRelativeTime(a.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Top workflows + Integration health */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
        }}
      >
        {/* Top workflows */}
        <Card>
          <CardHeader title="Top workflows" subtitle="By run volume" />
          <CardBody style={{ padding: 0 }}>
            {(analytics?.topWorkflows ?? []).length === 0 ? (
              <EmptyState icon="⬡" title="No workflows run yet" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Runs</th>
                    <th>Success</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.topWorkflows ?? []).slice(0, 5).map(w => (
                    <tr key={w.id}>
                      <td>
                        <Link
                          href={`/workflows/${w.id}`}
                          style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {w.name}
                        </Link>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                        {w.runs}
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              w.successRate >= 90
                                ? 'var(--success)'
                                : w.successRate >= 70
                                ? 'var(--warning)'
                                : 'var(--danger)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {formatPercent(w.successRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Integration health */}
        <Card>
          <CardHeader
            title="Integration health"
            actions={
              <Link href="/integrations" style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}>
                Manage →
              </Link>
            }
          />
          <CardBody style={{ padding: 0 }}>
            {integrations.length === 0 ? (
              <EmptyState
                icon="⚙"
                title="No integrations connected"
                description="Connect your first system to start orchestrating workflows."
                action={
                  <Link href="/integrations">
                    <Button variant="secondary" size="sm">
                      Add integration
                    </Button>
                  </Link>
                }
              />
            ) : (
              <ul style={{ listStyle: 'none' }}>
                {integrations.slice(0, 6).map(integration => (
                  <li
                    key={integration.id}
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {integration.name}
                    </span>
                    <StatusDot status={integration.status} showLabel />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
