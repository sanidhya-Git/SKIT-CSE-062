import React from 'react';
import type { IntegrationStatus } from '@/lib/types';

interface StatusDotProps {
  status: IntegrationStatus;
  label?: string;
  showLabel?: boolean;
}

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
  not_connected: 'Not connected',
};

export function StatusDot({ status, label, showLabel = false }: StatusDotProps) {
  const displayStatus = status === 'not_connected' ? 'unknown' : status;
  const text = label ?? STATUS_LABEL[status];

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
      title={text}
    >
      <span
        className={`status-dot ${displayStatus}`}
        role="img"
        aria-label={text}
      />
      {showLabel && (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{text}</span>
      )}
    </span>
  );
}
