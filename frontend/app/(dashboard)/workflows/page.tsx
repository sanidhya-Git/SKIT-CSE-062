'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { workflowsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { usePagination } from '@/hooks/usePagination';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Workflow, WorkflowStatus } from '@/lib/types';
import { debounce } from '@/lib/utils';

const STATUS_FILTERS: { value: WorkflowStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
];

export default function WorkflowsPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const pagination = usePagination(12);

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WorkflowStatus | ''>('');

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const res = await workflowsApi.list(token, orgId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      });
      setWorkflows(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError('Could not load workflows. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, pagination.page, pagination.pageSize, status, search]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((val: unknown) => {
      setSearch(val as string);
      pagination.resetPage();
    }, 400),
    [pagination]
  );

  if (loading && workflows.length === 0) return <PageSpinner message="Loading workflows…" />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Automation</div>
          <h1 className="page-title">Workflows</h1>
          <p className="page-subtitle">{total} workflow{total !== 1 ? 's' : ''} in this organisation</p>
        </div>
        <div className="page-actions">
          <Link href="/workflows/new">
            <Button variant="primary">+ New workflow</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            className="form-input"
            placeholder="Search workflows…"
            onChange={e => debouncedSearch(e.target.value)}
            aria-label="Search workflows"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.375rem' }}>
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
                fontWeight: status === f.value ? 500 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && !loading && workflows.length === 0 && (
        <EmptyState
          icon="⬡"
          title="No workflows found"
          description={
            search || status
              ? 'Try adjusting your filters.'
              : 'Create your first workflow to start automating.'
          }
          action={
            !search && !status ? (
              <Link href="/workflows/new">
                <Button variant="primary">Create workflow</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {!error && workflows.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {workflows.map(w => (
              <WorkflowCard key={w.id} workflow={w} />
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Pagination
              page={pagination.page}
              totalPages={Math.ceil(total / pagination.pageSize)}
              total={total}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
