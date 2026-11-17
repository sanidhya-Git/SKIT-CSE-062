'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { StepType, WorkflowStep } from '@/lib/types';

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  onUpdate: (step: WorkflowStep) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const STEP_ICONS: Record<StepType, string> = {
  condition:        '⟨⟩',
  transform:        '⇄',
  delay:            '⏱',
  approval:         '✓',
  ai_task:          '◆',
  connector_action: '⚙',
  notification:     '🔔',
};

export function StepCard({
  step,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = STEP_ICONS[step.type] ?? '⬡';

  const updateConfig = (key: string, value: string) => {
    onUpdate({ ...step, config: { ...step.config, [key]: value } });
  };

  return (
    <div className="step-card">
      <div
        className="step-card-header"
        onClick={() => setExpanded(v => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(v => !v); }}
      >
        <span className="step-drag-handle" aria-hidden="true">⠿</span>
        <div className="step-type-icon" aria-hidden="true">{icon}</div>
        <div style={{ flex: 1 }}>
          <div className="step-card-name">
            {step.name || `Step ${index + 1}`}
          </div>
          <div className="step-card-type">{step.type.replace('_', ' ')}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={e => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            aria-label="Move step up"
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={e => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            aria-label="Move step down"
          >
            ↓
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={e => { e.stopPropagation(); onDelete(); }}
            aria-label="Delete step"
            style={{ color: 'var(--danger)' }}
          >
            ✕
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="step-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Step name"
              value={step.name}
              onChange={e => onUpdate({ ...step, name: e.target.value })}
              placeholder={`Step ${index + 1}`}
            />

            {step.type === 'condition' && (
              <Input
                label="Condition expression"
                value={(step.config.expression as string) ?? ''}
                onChange={e => updateConfig('expression', e.target.value)}
                placeholder='e.g. {{data.amount}} > 1000'
                hint="Use Handlebars-style template expressions."
              />
            )}

            {step.type === 'transform' && (
              <div className="form-group">
                <label className="form-label">Transform script</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={(step.config.script as string) ?? ''}
                  onChange={e => updateConfig('script', e.target.value)}
                  placeholder="// Return the transformed payload&#10;return { ...data, processedAt: new Date().toISOString() };"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                />
              </div>
            )}

            {step.type === 'delay' && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Input
                  label="Duration"
                  type="number"
                  min="1"
                  value={(step.config.duration as string) ?? ''}
                  onChange={e => updateConfig('duration', e.target.value)}
                  style={{ flex: 1 }}
                />
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit</label>
                  <select
                    className="form-select"
                    value={(step.config.unit as string) ?? 'seconds'}
                    onChange={e => updateConfig('unit', e.target.value)}
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
            )}

            {step.type === 'approval' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Input
                  label="Approval message"
                  value={(step.config.message as string) ?? ''}
                  onChange={e => updateConfig('message', e.target.value)}
                  placeholder="Explain what the approver is authorising"
                />
                <Input
                  label="Approver role (minimum)"
                  value={(step.config.requiredRole as string) ?? 'approver'}
                  onChange={e => updateConfig('requiredRole', e.target.value)}
                  placeholder="approver"
                />
              </div>
            )}

            {step.type === 'ai_task' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">AI action</label>
                  <select
                    className="form-select"
                    value={(step.config.action as string) ?? ''}
                    onChange={e => updateConfig('action', e.target.value)}
                  >
                    <option value="">Select an action</option>
                    <option value="chat">Chat</option>
                    <option value="lead_score">Lead Scorer</option>
                    <option value="email_generate">Email Generator</option>
                    <option value="ticket_analyze">Ticket Analyzer</option>
                    <option value="document_summarize">Document Summarizer</option>
                    <option value="workflow_suggest">Workflow Suggester</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Input mapping</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={(step.config.inputMapping as string) ?? ''}
                    onChange={e => updateConfig('inputMapping', e.target.value)}
                    placeholder='{"company": "{{data.company}}", "industry": "{{data.industry}}"}'
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            )}

            {step.type === 'connector_action' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Connector</label>
                  <select
                    className="form-select"
                    value={(step.config.connector as string) ?? ''}
                    onChange={e => updateConfig('connector', e.target.value)}
                  >
                    <option value="">Select a connector</option>
                    <option value="slack">Slack</option>
                    <option value="github">GitHub</option>
                    <option value="jira">Jira</option>
                    <option value="salesforce">Salesforce</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <Input
                  label="Action"
                  value={(step.config.action as string) ?? ''}
                  onChange={e => updateConfig('action', e.target.value)}
                  placeholder="e.g. send_message, create_issue"
                />
                <div className="form-group">
                  <label className="form-label">Parameters</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={(step.config.params as string) ?? ''}
                    onChange={e => updateConfig('params', e.target.value)}
                    placeholder='{"channel": "#ops", "text": "{{data.message}}"}'
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>
            )}

            {step.type === 'notification' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select
                    className="form-select"
                    value={(step.config.channel as string) ?? 'email'}
                    onChange={e => updateConfig('channel', e.target.value)}
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                <Input
                  label="Recipient"
                  value={(step.config.recipient as string) ?? ''}
                  onChange={e => updateConfig('recipient', e.target.value)}
                  placeholder="email@example.com or #channel"
                />
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={(step.config.message as string) ?? ''}
                    onChange={e => updateConfig('message', e.target.value)}
                    placeholder="Workflow step completed: {{step.name}}"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
