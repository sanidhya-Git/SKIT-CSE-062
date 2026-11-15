import React from 'react';
import Link from 'next/link';
import { Workflow } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: Workflow;
}

const TRIGGER_ICONS: Record<string, string> = {
  webhook: '🔗',
  schedule: '🕐',
  manual: '▶',
  connector_event: '⚡',
};

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const icon = TRIGGER_ICONS[workflow.trigger?.type] ?? '⬡';

  return (
    <Link href={`/workflows/${workflow.id}`} className="workflow-card">
      <div className="workflow-card-icon" aria-hidden="true">{icon}</div>
      <div className="workflow-card-content">
        <div className="workflow-card-name">{workflow.name}</div>
        {workflow.description && (
          <div className="workflow-card-desc">{workflow.description}</div>
        )}
        <div className="workflow-card-meta">
          <Badge variant={workflow.status as Parameters<typeof Badge>[0]['variant']}>
            {workflow.status}
          </Badge>
          <span>{workflow.steps?.length ?? 0} steps</span>
          {workflow.lastRunAt && (
            <span>Last run {formatRelativeTime(workflow.lastRunAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
