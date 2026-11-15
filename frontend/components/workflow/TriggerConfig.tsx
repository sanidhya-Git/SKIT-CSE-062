'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { TriggerType, WorkflowTrigger } from '@/lib/types';

interface TriggerConfigProps {
  trigger: WorkflowTrigger;
  onChange: (trigger: WorkflowTrigger) => void;
}

const TRIGGER_TYPES: { value: TriggerType; label: string; icon: string }[] = [
  { value: 'webhook',         label: 'Webhook',         icon: '🔗' },
  { value: 'schedule',        label: 'Schedule (Cron)',  icon: '🕐' },
  { value: 'manual',          label: 'Manual',          icon: '▶' },
  { value: 'connector_event', label: 'Connector Event', icon: '⚡' },
];

export function TriggerConfig({ trigger, onChange }: TriggerConfigProps) {
  const updateConfig = (key: string, value: string) => {
    onChange({ ...trigger, config: { ...trigger.config, [key]: value } });
  };

  const updateType = (type: string) => {
    onChange({ type: type as TriggerType, config: {} });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Trigger type selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.625rem',
        }}
        role="radiogroup"
        aria-label="Trigger type"
      >
        {TRIGGER_TYPES.map(t => (
          <button
            key={t.value}
            role="radio"
            aria-checked={trigger.type === t.value}
            onClick={() => updateType(t.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background:
                trigger.type === t.value ? 'var(--accent-dim)' : 'var(--surface-raised)',
              border: `1px solid ${trigger.type === t.value ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: trigger.type === t.value ? 600 : 400,
              color: trigger.type === t.value ? 'var(--accent)' : 'var(--text)',
              transition: 'all var(--transition)',
            }}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Type-specific config */}
      {trigger.type === 'webhook' && (
        <div>
          <div
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '0.875rem 1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--accent)',
              marginBottom: '0.75rem',
            }}
          >
            POST https://api.oneops.ai/webhooks/{'<workflow-id>'}
          </div>
          <Input
            label="Shared secret (optional)"
            type="password"
            placeholder="Leave blank to generate one"
            value={(trigger.config.secret as string) ?? ''}
            onChange={e => updateConfig('secret', e.target.value)}
          />
        </div>
      )}

      {trigger.type === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Input
            label="Cron expression"
            placeholder="0 9 * * 1-5  (weekdays at 9 AM UTC)"
            value={(trigger.config.cron as string) ?? ''}
            onChange={e => updateConfig('cron', e.target.value)}
            hint="Standard 5-field cron. Times are in UTC."
          />
          <Select
            label="Timezone"
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'Eastern (ET)' },
              { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
              { value: 'Europe/London', label: 'London (GMT)' },
              { value: 'Europe/Paris', label: 'Paris (CET)' },
              { value: 'Asia/Kolkata', label: 'India (IST)' },
              { value: 'Asia/Tokyo', label: 'Japan (JST)' },
            ]}
            value={(trigger.config.timezone as string) ?? 'UTC'}
            onChange={e => updateConfig('timezone', e.target.value)}
          />
        </div>
      )}

      {trigger.type === 'manual' && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}
        >
          This workflow starts only when triggered manually from the workflow detail page or via the API.
        </div>
      )}

      {trigger.type === 'connector_event' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Select
            label="Connector"
            options={[
              { value: 'slack', label: 'Slack' },
              { value: 'github', label: 'GitHub' },
              { value: 'jira', label: 'Jira' },
              { value: 'salesforce', label: 'Salesforce' },
              { value: 'hubspot', label: 'HubSpot' },
            ]}
            placeholder="Select a connector"
            value={(trigger.config.connector as string) ?? ''}
            onChange={e => updateConfig('connector', e.target.value)}
          />
          <Input
            label="Event name"
            placeholder="e.g. issue.created, deal.won"
            value={(trigger.config.event as string) ?? ''}
            onChange={e => updateConfig('event', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
