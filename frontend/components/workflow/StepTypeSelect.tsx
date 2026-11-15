'use client';

import React from 'react';
import type { StepType } from '@/lib/types';

interface StepTypeSelectProps {
  value: StepType | '';
  onChange: (type: StepType) => void;
  disabled?: boolean;
}

const STEP_TYPES: { value: StepType; label: string; icon: string; description: string }[] = [
  { value: 'condition',       label: 'Condition',         icon: '⟨⟩', description: 'Branch based on a logical test' },
  { value: 'transform',       label: 'Transform',         icon: '⇄',  description: 'Map or reshape data' },
  { value: 'delay',           label: 'Delay',             icon: '⏱',  description: 'Wait for a fixed duration' },
  { value: 'approval',        label: 'Approval',          icon: '✓',  description: 'Pause for human sign-off' },
  { value: 'ai_task',         label: 'AI Task',           icon: '◆',  description: 'Classify, summarise, or extract' },
  { value: 'connector_action',label: 'Connector Action',  icon: '⚙',  description: 'Call a connected system' },
  { value: 'notification',    label: 'Notification',      icon: '🔔', description: 'Send an alert or message' },
];

export function StepTypeSelect({ value, onChange, disabled }: StepTypeSelectProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '0.625rem',
      }}
      role="radiogroup"
      aria-label="Step type"
    >
      {STEP_TYPES.map(type => (
        <button
          key={type.value}
          role="radio"
          aria-checked={value === type.value}
          onClick={() => onChange(type.value)}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            padding: '0.75rem',
            background: value === type.value ? 'var(--accent-dim)' : 'var(--surface-raised)',
            border: `1px solid ${value === type.value ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--border-radius-sm)',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--font-sans)',
            transition: 'all var(--transition)',
          }}
        >
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }} aria-hidden="true">
            {type.icon}
          </span>
          <span>
            <span
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: value === type.value ? 'var(--accent)' : 'var(--text)',
                marginBottom: '0.125rem',
              }}
            >
              {type.label}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}
            >
              {type.description}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
