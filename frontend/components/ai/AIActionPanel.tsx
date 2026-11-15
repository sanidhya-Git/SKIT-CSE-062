'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { scoreColor } from '@/lib/utils';
import type { AIAction } from '@/lib/types';

interface AIActionPanelProps {
  orgId: string;
  action: AIAction;
}

export function AIActionPanel({ orgId, action }: AIActionPanelProps) {
  const { token } = useAuth();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key: string, value: string) =>
    setFields(prev => ({ ...prev, [key]: value }));

  const run = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await aiApi.run(token, orgId, { action, input: fields });
      setResult(res.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <ActionForm action={action} fields={fields} setField={setField} />

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--danger)',
            fontSize: '0.875rem',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Button variant="primary" onClick={run} loading={loading}>
          Run
        </Button>
      </div>

      {result && <AIResult action={action} result={result} />}
    </div>
  );
}

function ActionForm({
  action,
  fields,
  setField,
}: {
  action: AIAction;
  fields: Record<string, string>;
  setField: (k: string, v: string) => void;
}) {
  switch (action) {
    case 'lead_score':
      return (
        <div className="grid-2">
          <Input label="Company" value={fields.company ?? ''} onChange={e => setField('company', e.target.value)} placeholder="Acme Corp" />
          <Input label="Industry" value={fields.industry ?? ''} onChange={e => setField('industry', e.target.value)} placeholder="SaaS" />
          <Input label="Annual revenue ($)" type="number" value={fields.revenue ?? ''} onChange={e => setField('revenue', e.target.value)} placeholder="2000000" />
          <Input label="Employees" type="number" value={fields.employees ?? ''} onChange={e => setField('employees', e.target.value)} placeholder="150" />
        </div>
      );

    case 'email_generate':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <Input label="Recipient name" value={fields.recipientName ?? ''} onChange={e => setField('recipientName', e.target.value)} placeholder="Jane Smith" />
            <Input label="Recipient company" value={fields.recipientCompany ?? ''} onChange={e => setField('recipientCompany', e.target.value)} placeholder="Acme Corp" />
          </div>
          <Input label="Industry" value={fields.industry ?? ''} onChange={e => setField('industry', e.target.value)} placeholder="Manufacturing" />
          <Select
            label="Tone"
            value={fields.tone ?? 'professional'}
            onChange={e => setField('tone', e.target.value)}
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'friendly', label: 'Friendly' },
              { value: 'concise', label: 'Concise' },
              { value: 'persuasive', label: 'Persuasive' },
            ]}
          />
        </div>
      );

    case 'ticket_analyze':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Ticket subject" value={fields.subject ?? ''} onChange={e => setField('subject', e.target.value)} placeholder="Login fails after password reset" />
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={fields.description ?? ''}
              onChange={e => setField('description', e.target.value)}
              placeholder="Describe the issue in detail…"
              rows={4}
            />
          </div>
          <div className="grid-2">
            <Select
              label="Category"
              value={fields.category ?? ''}
              placeholder="Select category"
              onChange={e => setField('category', e.target.value)}
              options={[
                { value: 'bug', label: 'Bug' },
                { value: 'feature', label: 'Feature request' },
                { value: 'billing', label: 'Billing' },
                { value: 'general', label: 'General' },
              ]}
            />
            <Select
              label="Priority"
              value={fields.priority ?? ''}
              placeholder="Select priority"
              onChange={e => setField('priority', e.target.value)}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </div>
        </div>
      );

    case 'document_summarize':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Document text</label>
            <textarea
              className="form-textarea"
              value={fields.text ?? ''}
              onChange={e => setField('text', e.target.value)}
              placeholder="Paste the document content here…"
              rows={6}
            />
          </div>
          <Select
            label="Summary type"
            value={fields.summaryType ?? 'concise'}
            onChange={e => setField('summaryType', e.target.value)}
            options={[
              { value: 'concise', label: 'Concise (3–5 sentences)' },
              { value: 'detailed', label: 'Detailed (full summary)' },
              { value: 'bullets', label: 'Bullet points' },
              { value: 'exec', label: 'Executive brief' },
            ]}
          />
        </div>
      );

    case 'predictive_analytics':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Select
            label="Module"
            value={fields.module ?? ''}
            placeholder="Select a module"
            onChange={e => setField('module', e.target.value)}
            options={[
              { value: 'churn', label: 'Churn prediction' },
              { value: 'revenue', label: 'Revenue forecast' },
              { value: 'capacity', label: 'Capacity planning' },
              { value: 'demand', label: 'Demand forecast' },
            ]}
          />
          <div className="form-group">
            <label className="form-label">Context</label>
            <textarea
              className="form-textarea"
              value={fields.context ?? ''}
              onChange={e => setField('context', e.target.value)}
              placeholder="Paste relevant data or describe the current situation…"
              rows={4}
            />
          </div>
        </div>
      );

    case 'vendor_scorecard':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <Input label="Vendor name" value={fields.vendorName ?? ''} onChange={e => setField('vendorName', e.target.value)} placeholder="Contoso Ltd" />
            <Input label="Category" value={fields.category ?? ''} onChange={e => setField('category', e.target.value)} placeholder="Cloud infrastructure" />
          </div>
          <Input label="Contract value ($)" type="number" value={fields.contractValue ?? ''} onChange={e => setField('contractValue', e.target.value)} />
          <div className="form-group">
            <label className="form-label">Performance notes</label>
            <textarea
              className="form-textarea"
              value={fields.notes ?? ''}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Uptime, support quality, delivery speed, issues…"
              rows={3}
            />
          </div>
        </div>
      );

    case 'workflow_suggest':
      return (
        <div className="grid-2">
          <Input label="Trigger event" value={fields.triggerEvent ?? ''} onChange={e => setField('triggerEvent', e.target.value)} placeholder="deal.won" />
          <Input label="Object type" value={fields.objectType ?? ''} onChange={e => setField('objectType', e.target.value)} placeholder="Deal / Contact / Ticket" />
        </div>
      );

    case 'inventory_reorder':
      return (
        <div className="form-group">
          <label className="form-label">Items (JSON array)</label>
          <textarea
            className="form-textarea"
            value={fields.items ?? ''}
            onChange={e => setField('items', e.target.value)}
            placeholder='[{"sku":"WIDGET-01","stock":12,"reorderPoint":20,"leadDays":5}]'
            rows={5}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
          />
        </div>
      );

    case 'project_health':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <Select
              label="Status"
              value={fields.status ?? ''}
              placeholder="Select status"
              onChange={e => setField('status', e.target.value)}
              options={[
                { value: 'on_track', label: 'On track' },
                { value: 'at_risk', label: 'At risk' },
                { value: 'off_track', label: 'Off track' },
              ]}
            />
            <Input label="Completion (%)" type="number" min="0" max="100" value={fields.completion ?? ''} onChange={e => setField('completion', e.target.value)} />
          </div>
          <Input label="Budget remaining ($)" type="number" value={fields.budgetRemaining ?? ''} onChange={e => setField('budgetRemaining', e.target.value)} />
          <div className="form-group">
            <label className="form-label">Blocked tasks (comma-separated)</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={fields.blockedTasks ?? ''}
              onChange={e => setField('blockedTasks', e.target.value)}
              placeholder="Infrastructure approval, Security review"
            />
          </div>
        </div>
      );

    case 'sales_forecast':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <Input label="Start date" type="date" value={fields.startDate ?? ''} onChange={e => setField('startDate', e.target.value)} />
            <Input label="End date" type="date" value={fields.endDate ?? ''} onChange={e => setField('endDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Pipeline data (JSON)</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={fields.pipeline ?? ''}
              onChange={e => setField('pipeline', e.target.value)}
              placeholder='[{"stage":"Proposal","amount":50000,"probability":0.3}]'
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
            />
          </div>
        </div>
      );

    case 'win_probability':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <Select
              label="Deal stage"
              value={fields.stage ?? ''}
              placeholder="Select stage"
              onChange={e => setField('stage', e.target.value)}
              options={[
                { value: 'discovery', label: 'Discovery' },
                { value: 'proposal', label: 'Proposal sent' },
                { value: 'negotiation', label: 'In negotiation' },
                { value: 'verbal_commit', label: 'Verbal commit' },
              ]}
            />
            <Input label="Deal amount ($)" type="number" value={fields.amount ?? ''} onChange={e => setField('amount', e.target.value)} />
          </div>
          <div className="grid-2">
            <Input label="Days to close" type="number" value={fields.daysToClose ?? ''} onChange={e => setField('daysToClose', e.target.value)} />
            <Input label="Industry" value={fields.industry ?? ''} onChange={e => setField('industry', e.target.value)} placeholder="SaaS" />
          </div>
        </div>
      );

    default:
      return null;
  }
}

function AIResult({ action, result }: { action: AIAction; result: Record<string, unknown> }) {
  const renderScore = (score: unknown, label: string) => (
    <div>
      <div className="ai-result-label">{label}</div>
      <div
        className="ai-score"
        style={{ color: scoreColor(Number(score)) }}
        aria-label={`${label}: ${score}`}
      >
        {Number(score).toFixed(0)}
        <span style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-muted)' }}>/100</span>
      </div>
    </div>
  );

  return (
    <div className="ai-result">
      {action === 'lead_score' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {renderScore(result.score, 'Lead score')}
          {!!result.reason && (
            <div>
              <div className="ai-result-label">Reasoning</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {String(result.reason)}
              </p>
            </div>
          )}
          {!!result.emailDraft && (
            <div>
              <div className="ai-result-label">Draft outreach email</div>
              <div
                style={{
                  background: 'var(--ground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {String(result.emailDraft)}
              </div>
            </div>
          )}
        </div>
      )}

      {action === 'win_probability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {renderScore(result.probability, 'Win probability')}
          {!!result.reasoning && (
            <div>
              <div className="ai-result-label">Factors</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {String(result.reasoning)}
              </p>
            </div>
          )}
        </div>
      )}

      {action === 'project_health' && result.score != null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {renderScore(result.score, 'Health score')}
          {!!result.risks && (
            <div>
              <div className="ai-result-label">Key risks</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {String(result.risks)}
              </p>
            </div>
          )}
          {!!result.recommendations && (
            <div>
              <div className="ai-result-label">Recommended actions</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                {String(result.recommendations)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Generic text result */}
      {!['lead_score', 'win_probability', 'project_health'].includes(action) && (
        <div>
          <div className="ai-result-label">Result</div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {typeof result.text === 'string'
              ? result.text
              : typeof result.summary === 'string'
              ? result.summary
              : typeof result.message === 'string'
              ? result.message
              : JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
