'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { runsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { usePagination } from '@/hooks/usePagination';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { RunStatusBadge } from '@/components/workflow/RunStatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import type { RunStatus, WorkflowRun } from '@/lib/types';
import { formatDate, formatDuration, formatRelativeTime } from '@/lib/utils';

const STATUS_FILTERS: { value: RunStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function RunsPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const pagination = usePagination(20);

  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<RunStatus | ''>('');

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const res = await runsApi.list(token, orgId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...(status ? { status } : {}),
      });
      setRuns(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError('Could not load runs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, pagination.page, pagination.pageSize, status]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<WorkflowRun>[] = [
    {
      key: 'workflow',
      header: 'Workflow',
      render: run => (
        <Link
          href={`/runs/${run.id}`}
          style={{ color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}
        >
          {run.workflowName}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: run => <RunStatusBadge status={run.status} />,
      width: '120px',
    },
    {
      key: 'trigger',
      header: 'Trigger',
      render: run => <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{run.trigger}</span>,
      width: '100px',
    },
    {
      key: 'started',
      header: 'Started',
      render: run => (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          {formatRelativeTime(run.startedAt)}
        </span>
      ),
      width: '130px',
    },
    {
      key: 'duration',
      header: 'Duration',
      render: run => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {formatDuration(run.durationMs)}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'steps',
      header: 'Steps',
      render: run => (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          {run.stepOutcomes?.length ?? 0}
        </span>
      ),
      width: '60px',
    },
    {
      key: 'actions',
      header: '',
      render: run => (
        <Link href={`/runs/${run.id}`} style={{ color: 'var(--accent)', fontSize: '0.8125rem' }}>
          View →
        </Link>
      ),
      width: '60px',
    },
  ];

  if (loading && runs.length === 0) return <PageSpinner message="Loading runs…" />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Automation</div>
          <h1 className="page-title">Workflow runs</h1>
          <p className="page-subtitle">{total} run{total !== 1 ? 's' : ''} recorded</p>
        </div>
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); pagination.resetPage(); }}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid',
              borderColor: status === f.value ? 'var(--accent)' : 'var(--border)',
              background: status === f.value ? 'var(--accent-dim)' : 'transparent',
              color: status === f.value ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <Table
            columns={columns}
            data={runs}
            isLoading={loading}
            keyExtractor={r => r.id}
            emptyMessage="No runs yet"
            emptyDescription="Workflow runs will appear here after you trigger a workflow."
            emptyIcon="▶"
          />
          <Pagination
            page={pagination.page}
            totalPages={Math.ceil(total / pagination.pageSize)}
            total={total}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </div>
  );
}
