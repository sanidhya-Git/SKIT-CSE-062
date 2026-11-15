import React from 'react';
import type { RunStatus } from '@/lib/types';

interface RunStatusBadgeProps {
  status: RunStatus;
}

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string; bg: string; dot?: string }> = {
  pending:   { label: 'Pending',   color: 'var(--warning)', bg: 'var(--warning-dim)',  dot: '○' },
  running:   { label: 'Running',   color: 'var(--info)',    bg: 'var(--info-dim)',      dot: '●' },
  completed: { label: 'Completed', color: 'var(--success)', bg: 'var(--success-dim)',   dot: '●' },
  failed:    { label: 'Failed',    color: 'var(--danger)',  bg: 'var(--danger-dim)',    dot: '●' },
  cancelled: { label: 'Cancelled', color: 'var(--text-muted)', bg: 'rgba(136,146,164,0.12)' },
};

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.cancelled;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '0.1875rem 0.5rem',
        borderRadius: '100px',
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      {cfg.dot && <span style={{ fontSize: '0.5rem' }} aria-hidden="true">{cfg.dot}</span>}
      {cfg.label}
    </span>
  );
}
