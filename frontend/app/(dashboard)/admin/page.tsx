'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { AuditEntry } from '@/lib/types';
import { formatDate, debounce, getInitials } from '@/lib/utils';
import { usePagination } from '@/hooks/usePagination';

const ACTION_TYPES = [
  { value: '', label: 'All actions' },
  { value: 'workflow.created', label: 'Workflow created' },
  { value: 'workflow.published', label: 'Workflow published' },
  { value: 'workflow.deleted', label: 'Workflow deleted' },
  { value: 'approval.approved', label: 'Approval approved' },
  { value: 'approval.rejected', label: 'Approval rejected' },
  { value: 'member.invited', label: 'Member invited' },
  { value: 'member.removed', label: 'Member removed' },
  { value: 'integration.connected', label: 'Integration connected' },
  { value: 'integration.disconnected', label: 'Integration disconnected' },
];

export default function AdminPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const pagination = usePagination(25);

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const res = await auditApi.list(token, orgId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...(action ? { action } : {}),
        ...(dateFrom ? { from: dateFrom } : {}),
        ...(dateTo ? { to: dateTo } : {}),
      });
      setEntries(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError('Could not load the audit log. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, pagination.page, pagination.pageSize, action, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<AuditEntry>[] = [
    {
      key: 'actor',
      header: 'Actor',
      render: entry => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'white',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {getInitials(entry.actorName)}
          </div>
          <span style={{ fontSize: '0.875rem' }}>{entry.actorName}</span>
        </div>
      ),
      width: '180px',
    },
    {
      key: 'action',
      header: 'Action',
      render: entry => (
        <span className="audit-action" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          {entry.action}
        </span>
      ),
      width: '200px',
    },
    {
      key: 'resource',
      header: 'Resource',
      render: entry => (
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{entry.resourceName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'capitalize' }}>
            {entry.resourceType}
          </div>
        </div>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: entry => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {entry.ipAddress}
        </span>
      ),
      width: '130px',
    },
    {
      key: 'time',
      header: 'Time',
      render: entry => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {formatDate(entry.timestamp, true)}
        </span>
      ),
      width: '170px',
    },
  ];

  if (loading && entries.length === 0) return <PageSpinner message="Loading audit log…" />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Admin</div>
          <h1 className="page-title">Audit log</h1>
          <p className="page-subtitle">
            A complete record of every action taken in this organisation
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="form-select"
          value={action}
          onChange={e => { setAction(e.target.value); pagination.resetPage(); }}
          style={{ width: 'auto', minWidth: '180px' }}
          aria-label="Filter by action type"
        >
          {ACTION_TYPES.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            From
          </label>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); pagination.resetPage(); }}
            style={{ width: 'auto' }}
            aria-label="From date"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            To
          </label>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); pagination.resetPage(); }}
            style={{ width: 'auto' }}
            aria-label="To date"
          />
        </div>

        {(action || dateFrom || dateTo) && (
          <button
            onClick={() => { setAction(''); setDateFrom(''); setDateTo(''); pagination.resetPage(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-sans)',
              padding: '0.375rem',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <Table
            columns={columns}
            data={entries}
            isLoading={loading}
            keyExtractor={e => e.id}
            emptyMessage="No audit events found"
            emptyDescription="Audit entries appear here as your team takes actions."
            emptyIcon="📋"
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
