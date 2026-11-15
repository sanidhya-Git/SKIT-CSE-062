'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { workflowsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TriggerConfig } from '@/components/workflow/TriggerConfig';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import type { WorkflowTrigger } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

export default function NewWorkflowPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<WorkflowTrigger>({ type: 'manual', config: {} });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Workflow name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !token || !orgId) return;

    setLoading(true);
    try {
      const workflow = await workflowsApi.create(token, orgId, {
        name: name.trim(),
        description: description.trim(),
        trigger,
      });
      showToast('success', 'Workflow created', `"${workflow.name}" is ready to edit.`);
      router.push(`/workflows/${workflow.id}/edit`);
    } catch (err) {
      showToast('error', 'Could not create workflow', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Workflows</div>
          <h1 className="page-title">New workflow</h1>
          <p className="page-subtitle">Give it a name and choose how it starts.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card>
          <CardHeader title="Basic info" />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                error={errors.name}
                required
                placeholder="e.g. Onboard new customer"
              />
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this workflow do, and when should it run?"
                  rows={3}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Trigger" subtitle="How this workflow starts" />
          <CardBody>
            <TriggerConfig trigger={trigger} onChange={setTrigger} />
          </CardBody>
        </Card>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create workflow
          </Button>
        </div>
      </form>
    </div>
  );
}
