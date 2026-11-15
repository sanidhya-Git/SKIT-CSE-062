'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { approvalsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Approval, ApprovalStatus } from '@/lib/types';
import { formatRelativeTime, getErrorMessage } from '@/lib/utils';
import Link from 'next/link';

const STATUS_FILTERS: { value: ApprovalStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

export default function ApprovalsPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const { showToast } = useToast();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ApprovalStatus | ''>('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'approve' | 'reject';
    approval: Approval;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const res = await approvalsApi.list(token, orgId, {
        status: status || undefined,
        pageSize: 50,
      });
      setApprovals(res.data);
    } catch {
      setError('Could not load approvals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, status]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!pendingAction || !token || !orgId) return;
    setActionLoading(true);
    try {
      await approvalsApi.approve(token, orgId, pendingAction.approval.id);
      showToast('success', 'Approved', `"${pendingAction.approval.stepName}" approved.`);
      setPendingAction(null);
      load();
    } catch (err) {
      showToast('error', 'Could not approve', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!pendingAction || !token || !orgId) return;
    if (!rejectReason.trim()) {
      showToast('error', 'Reason required', 'Please explain why you are rejecting this action.');
      return;
    }
    setActionLoading(true);
    try {
      await approvalsApi.reject(token, orgId, pendingAction.approval.id, rejectReason.trim());
      showToast('success', 'Rejected', `"${pendingAction.approval.stepName}" rejected.`);
      setPendingAction(null);
      setRejectReason('');
      load();
    } catch (err) {
      showToast('error', 'Could not reject', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageSpinner message="Loading approvals…" />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Governance</div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Review and act on workflow steps waiting for your decision</p>
        </div>
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
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

      {!error && approvals.length === 0 && (
        <EmptyState
          icon="✓"
          title="No approvals found"
          description={
            status === 'pending'
              ? "Nothing is waiting for your approval right now."
              : "No approvals match this filter."
          }
        />
      )}

      {!error && approvals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {approvals.map(approval => (
            <div key={approval.id} className="approval-card">
              <div className="approval-icon" aria-hidden="true">⚑</div>
              <div className="approval-content">
                <div className="approval-title">{approval.stepName}</div>
                <div className="approval-meta">
                  <span>
                    <Link href={`/workflows/${approval.workflowId}`} style={{ color: 'var(--accent)' }}>
                      {approval.workflowName}
                    </Link>
                  </span>
                  {' · '}
                  <span>Requested by {approval.requestedBy}</span>
                  {' · '}
                  <span>{formatRelativeTime(approval.createdAt)}</span>
                  {approval.expiresAt && (
                    <> · <span style={{ color: 'var(--warning)' }}>Expires {formatRelativeTime(approval.expiresAt)}</span></>
                  )}
                </div>
                {approval.message && (
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text)',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '0.625rem 0.75rem',
                      marginBottom: '0.75rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {approval.message}
                  </div>
                )}
                {approval.status === 'pending' && (
                  <div className="approval-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPendingAction({ type: 'approve', approval })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingAction({ type: 'reject', approval })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
                {approval.status !== 'pending' && (
                  <Badge variant={approval.status as Parameters<typeof Badge>[0]['variant']}>
                    {approval.status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve confirm */}
      <ConfirmDialog
        open={pendingAction?.type === 'approve'}
        onClose={() => setPendingAction(null)}
        onConfirm={handleApprove}
        title="Approve action"
        description={`You are approving "${pendingAction?.approval.stepName}". The workflow step will continue.`}
        confirmLabel="Approve"
        confirmVariant="primary"
        loading={actionLoading}
      />

      {/* Reject dialog */}
      {pendingAction?.type === 'reject' && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setPendingAction(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Reject approval">
            <div className="modal-header">
              <h2 className="modal-title">Reject action</h2>
              <button className="modal-close" onClick={() => { setPendingAction(null); setRejectReason(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Rejecting "{pendingAction.approval.stepName}" will stop this workflow run. Provide a reason so the requester understands what to change.
              </p>
              <div className="form-group">
                <label className="form-label required">Reason for rejection</label>
                <textarea
                  className="form-textarea"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain why this action cannot proceed…"
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => { setPendingAction(null); setRejectReason(''); }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject} loading={actionLoading}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
