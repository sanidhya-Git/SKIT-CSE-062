'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { workflowsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Workflow } from '@/lib/types';
import { formatDate, formatRelativeTime, getErrorMessage } from '@/lib/utils';

const STEP_ICONS: Record<string, string> = {
  condition: '⟨⟩',
  transform: '⇄',
  delay: '⏱',
  approval: '✓',
  ai_task: '◆',
  connector_action: '⚙',
  notification: '🔔',
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const { showToast } = useToast();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const data = await workflowsApi.get(token, orgId, workflowId);
      setWorkflow(data);
    } catch {
      setError('Could not load this workflow. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, workflowId]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async () => {
    if (!token || !orgId || !workflow) return;
    setActionLoading(true);
    try {
      const updated = await workflowsApi.publish(token, orgId, workflowId);
      setWorkflow(updated);
      showToast('success', 'Published', `"${updated.name}" is now live.`);
    } catch (err) {
      showToast('error', 'Could not publish', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    if (!token || !orgId || !workflow) return;
    setActionLoading(true);
    try {
      const updated = await workflowsApi.pause(token, orgId, workflowId);
      setWorkflow(updated);
      showToast('success', 'Paused', `"${updated.name}" is paused.`);
    } catch (err) {
      showToast('error', 'Could not pause', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRun = async () => {
    if (!token || !orgId) return;
    setActionLoading(true);
    try {
      const run = await workflowsApi.run(token, orgId, workflowId);
      showToast('success', 'Run started', `Run ${run.id.slice(0, 8)}… is in progress.`);
      router.push(`/runs/${run.id}`);
    } catch (err) {
      showToast('error', 'Could not start run', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !orgId) return;
    try {
      await workflowsApi.delete(token, orgId, workflowId);
      showToast('success', 'Deleted', `Workflow deleted.`);
      router.push('/workflows');
    } catch (err) {
      showToast('error', 'Could not delete', getErrorMessage(err));
    }
  };

  if (loading) return <PageSpinner message="Loading workflow…" />;
  if (error || !workflow) return <ErrorState message={error} onRetry={load} />;

  const canPublish = workflow.status === 'draft' || workflow.status === 'paused';
  const canPause = workflow.status === 'published';
  const canRun = workflow.status === 'published';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">
            <Link href="/workflows" style={{ color: 'var(--accent)' }}>Workflows</Link>
            {' / '}
            <span style={{ color: 'var(--text-muted)' }}>{workflow.name}</span>
          </div>
          <h1 className="page-title">{workflow.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Badge variant={workflow.status as Parameters<typeof Badge>[0]['variant']} dot>
              {workflow.status}
            </Badge>
            <span className="text-muted text-sm">v{workflow.version}</span>
            {workflow.lastRunAt && (
              <span className="text-muted text-sm">
                Last run {formatRelativeTime(workflow.lastRunAt)}
              </span>
            )}
          </div>
        </div>
        <div className="page-actions">
          {canPublish && (
            <Button variant="primary" onClick={handlePublish} loading={actionLoading}>
              Publish
            </Button>
          )}
          {canPause && (
            <Button variant="secondary" onClick={handlePause} loading={actionLoading}>
              Pause
            </Button>
          )}
          {canRun && (
            <Button variant="secondary" onClick={handleRun} loading={actionLoading}>
              ▶ Run now
            </Button>
          )}
          <Link href={`/workflows/${workflowId}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Steps */}
        <Card>
          <CardHeader
            title="Steps"
            subtitle={`${workflow.steps?.length ?? 0} step${(workflow.steps?.length ?? 0) !== 1 ? 's' : ''}`}
            actions={
              <Link href={`/workflows/${workflowId}/edit`}>
                <Button variant="ghost" size="sm">Edit steps</Button>
              </Link>
            }
          />
          <CardBody style={{ padding: '1.25rem' }}>
            {!workflow.steps || workflow.steps.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.875rem' }}>
                No steps configured.{' '}
                <Link href={`/workflows/${workflowId}/edit`} style={{ color: 'var(--accent)' }}>
                  Add steps
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {workflow.steps.map((step, i) => (
                  <div
                    key={step.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.875rem',
                      background: 'var(--surface-raised)',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'var(--accent-dim)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>
                        {step.name || `Step ${i + 1}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        {STEP_ICONS[step.type] ?? '⬡'} {step.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Metadata sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <CardHeader title="Trigger" />
            <CardBody>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '0.375rem', fontSize: '0.75rem' }}>
                  Type
                </div>
                <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                  {workflow.trigger?.type?.replace('_', ' ') ?? 'Manual'}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                }}
              >
                <dt style={{ color: 'var(--text-muted)' }}>Created</dt>
                <dd>{formatDate(workflow.createdAt, true)}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>Updated</dt>
                <dd>{formatDate(workflow.updatedAt, true)}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>Total runs</dt>
                <dd>{workflow.runCount ?? 0}</dd>
                <dt style={{ color: 'var(--text-muted)' }}>Version</dt>
                <dd>v{workflow.version}</dd>
              </dl>
            </CardBody>
          </Card>

          <Link href={`/runs?workflowId=${workflowId}`}>
            <Button variant="secondary" size="sm" className="w-full">
              View run history →
            </Button>
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete workflow"
        description={`"${workflow.name}" and all its run history will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete workflow"
        confirmVariant="danger"
      />
    </div>
  );
}
