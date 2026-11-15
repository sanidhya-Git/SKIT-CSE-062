'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { runsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { RunStatusBadge } from '@/components/workflow/RunStatusBadge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { WorkflowRun, StepOutcome } from '@/lib/types';
import { formatDate, formatDuration, formatRelativeTime } from '@/lib/utils';

const STEP_STATUS_ICONS: Record<string, string> = {
  success: '✓',
  completed: '✓',
  failed: '✕',
  running: '◌',
  pending: '○',
  cancelled: '—',
};

export default function RunDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const runId = params.runId as string;

  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const data = await runsApi.get(token, orgId, runId);
      setRun(data);
    } catch {
      setError('Could not load this run. It may have been archived or deleted.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, runId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageSpinner message="Loading run…" />;
  if (error || !run) return <ErrorState message={error} onRetry={load} />;

  const steps = run.stepOutcomes ?? [];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">
            <Link href="/runs" style={{ color: 'var(--accent)' }}>Runs</Link>
            {' / '}
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
              {run.id.slice(0, 12)}…
            </span>
          </div>
          <h1 className="page-title">{run.workflowName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <RunStatusBadge status={run.status} />
            <span className="text-muted text-sm">
              {formatRelativeTime(run.startedAt)}
            </span>
            <span className="text-muted text-sm">
              {formatDuration(run.durationMs)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Step outcomes */}
        <Card>
          <CardHeader
            title="Step outcomes"
            subtitle={`${steps.length} step${steps.length !== 1 ? 's' : ''}`}
          />
          <CardBody>
            {steps.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: '2rem',
                  fontSize: '0.875rem',
                }}
              >
                No step outcomes recorded.
              </div>
            ) : (
              <div className="run-steps">
                {steps.map((step, i) => {
                  const statusClass =
                    step.status === 'completed'
                      ? 'success'
                      : step.status === 'failed'
                      ? 'failed'
                      : step.status === 'running'
                      ? 'running'
                      : 'pending';

                  return (
                    <div key={step.stepId} className="run-step">
                      <div className="run-step-connector">
                        <div className={`run-step-dot ${statusClass}`} aria-hidden="true">
                          {STEP_STATUS_ICONS[step.status] ?? '○'}
                        </div>
                        {i < steps.length - 1 && <div className="run-step-line" />}
                      </div>
                      <div className="run-step-content">
                        <div className="run-step-name">
                          {step.stepName}
                        </div>
                        <div className="run-step-meta">
                          <RunStatusBadge status={step.status as WorkflowRun['status']} />
                          {step.durationMs != null && (
                            <span style={{ marginLeft: '0.5rem' }}>
                              {formatDuration(step.durationMs)}
                            </span>
                          )}
                        </div>

                        {step.error && (
                          <div
                            style={{
                              padding: '0.625rem 0.75rem',
                              background: 'var(--danger-dim)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: '0.8125rem',
                              color: 'var(--danger)',
                              marginBottom: '0.5rem',
                            }}
                            role="alert"
                          >
                            {step.error}
                          </div>
                        )}

                        {step.logs && step.logs.length > 0 && (
                          <div className="run-step-log">
                            {step.logs.join('\n')}
                          </div>
                        )}

                        {step.output && Object.keys(step.output).length > 0 && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                              }}
                            >
                              Output data
                            </summary>
                            <div className="run-step-log" style={{ marginTop: '0.375rem' }}>
                              {JSON.stringify(step.output, null, 2)}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Run metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <CardHeader title="Run details" />
            <CardBody>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                }}
              >
                <dt style={{ color: 'var(--text-muted)' }}>Status</dt>
                <dd><RunStatusBadge status={run.status} /></dd>

                <dt style={{ color: 'var(--text-muted)' }}>Trigger</dt>
                <dd style={{ textTransform: 'capitalize' }}>{run.trigger}</dd>

                <dt style={{ color: 'var(--text-muted)' }}>Started</dt>
                <dd>{formatDate(run.startedAt, true)}</dd>

                {run.completedAt && (
                  <>
                    <dt style={{ color: 'var(--text-muted)' }}>Completed</dt>
                    <dd>{formatDate(run.completedAt, true)}</dd>
                  </>
                )}

                <dt style={{ color: 'var(--text-muted)' }}>Duration</dt>
                <dd style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatDuration(run.durationMs)}
                </dd>

                <dt style={{ color: 'var(--text-muted)' }}>Correlation ID</dt>
                <dd
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6875rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {run.correlationId}
                </dd>
              </dl>
            </CardBody>
          </Card>

          {run.error && (
            <Card>
              <CardHeader title="Error" />
              <CardBody>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    color: 'var(--danger)',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                  }}
                >
                  {run.error}
                </div>
              </CardBody>
            </Card>
          )}

          <Link href={`/workflows/${run.workflowId}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--border-radius)',
                fontSize: '0.875rem',
                color: 'var(--accent)',
                cursor: 'pointer',
                transition: 'border-color var(--transition)',
              }}
            >
              View workflow →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
