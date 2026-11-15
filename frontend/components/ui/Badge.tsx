import React from 'react';
import Chip from '@mui/material/Chip';

type BadgeVariant =
  | 'draft'
  | 'published'
  | 'running'
  | 'failed'
  | 'paused'
  | 'completed'
  | 'pending'
  | 'cancelled';

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  dot?: boolean;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  draft:     { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
  published: { bg: 'rgba(22,163,74,0.08)', color: '#16A34A', border: 'rgba(22,163,74,0.2)' },
  running:   { bg: 'rgba(37,99,235,0.08)', color: '#2563EB', border: 'rgba(37,99,235,0.2)' },
  failed:    { bg: 'rgba(220,38,38,0.08)', color: '#DC2626', border: 'rgba(220,38,38,0.2)' },
  paused:    { bg: 'rgba(217,119,6,0.08)', color: '#D97706', border: 'rgba(217,119,6,0.2)' },
  completed: { bg: 'rgba(22,163,74,0.08)', color: '#16A34A', border: 'rgba(22,163,74,0.2)' },
  pending:   { bg: 'rgba(217,119,6,0.08)', color: '#D97706', border: 'rgba(217,119,6,0.2)' },
  cancelled: { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
};

const DOT_VARIANTS: Set<BadgeVariant> = new Set(['published', 'running', 'failed', 'paused', 'completed', 'pending']);

export function Badge({ variant, children, dot = false }: BadgeProps) {
  const styles = BADGE_STYLES[variant] ?? BADGE_STYLES.draft;
  const label = children ?? variant;
  const showDot = dot && DOT_VARIANTS.has(variant);

  return (
    <Chip
      label={
        showDot ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
            {label}
          </span>
        ) : label
      }
      size="small"
      sx={{
        height: 22,
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        borderRadius: '100px',
        '& .MuiChip-label': { px: '0.5rem', py: 0 },
      }}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalised = status.toLowerCase() as BadgeVariant;
  return <Badge variant={normalised} dot>{status}</Badge>;
}
