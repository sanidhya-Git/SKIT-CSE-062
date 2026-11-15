'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { workflowsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StepBuilder } from '@/components/workflow/StepBuilder';
import { TriggerConfig } from '@/components/workflow/TriggerConfig';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Workflow, WorkflowStep, WorkflowTrigger } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

export default function WorkflowEditPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const { showToast } = useToast();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: 'manual', config: {} });
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    try {
      const data = await workflowsApi.get(token, orgId, workflowId);
      setWorkflow(data);
      setName(data.name);
      setDescription(data.description ?? '');
      setTrigger(data.trigger ?? { type: 'manual', config: {} });
      setSteps(data.steps ?? []);
    } catch {
      setError('Could not load this workflow. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId, workflowId]);

  useEffect(() => { load(); }, [load]);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    if (!token || !orgId) return;
    setSaving(true);
    try {
      const updated = await workflowsApi.update(token, orgId, workflowId, {
        name: name.trim(),
        description: description.trim(),
        trigger,
        steps,
      });
      setWorkflow(updated);
      setIsDirty(false);
      showToast('success', 'Saved', 'Workflow updated.');
    } catch (err) {
      showToast('error', 'Could not save', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner message="Loading workflow…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">
            <Link href="/workflows" style={{ color: 'var(--accent)' }}>Workflows</Link>
            {' / '}
            <Link href={`/workflows/${workflowId}`} style={{ color: 'var(--accent)' }}>
              {workflow?.name}
            </Link>
            {' / '}
            <span style={{ color: 'var(--text-muted)' }}>Edit</span>
          </div>
          <h1 className="page-title">Edit workflow</h1>
        </div>
        <div className="page-actions">
          <Button variant="ghost" onClick={() => router.push(`/workflows/${workflowId}`)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty}
          >
            Save changes
          </Button>
        </div>
      </div>

      {isDirty && (
        <div
          style={{
            padding: '0.625rem 1rem',
            background: 'var(--warning-dim)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--warning)',
            marginBottom: '1.25rem',
          }}
          role="status"
        >
          Unsaved changes — save before leaving this page.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Basic info */}
        <Card>
          <CardHeader title="Basic info" />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '560px' }}>
              <Input
                label="Name"
                value={name}
                onChange={e => { setName(e.target.value); markDirty(); }}
                required
              />
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={e => { setDescription(e.target.value); markDirty(); }}
                  rows={2}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Trigger */}
        <Card>
          <CardHeader title="Trigger" subtitle="How this workflow starts" />
          <CardBody>
            <TriggerConfig
              trigger={trigger}
              onChange={t => { setTrigger(t); markDirty(); }}
            />
          </CardBody>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader title="Steps" subtitle="Build the workflow step by step" />
          <CardBody>
            <StepBuilder
              steps={steps}
              onChange={s => { setSteps(s); markDirty(); }}
            />
          </CardBody>
        </Card>

        {/* Save footer */}
        <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '2rem' }}>
          <Button variant="ghost" onClick={() => router.push(`/workflows/${workflowId}`)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
