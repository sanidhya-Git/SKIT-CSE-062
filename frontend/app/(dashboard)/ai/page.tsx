'use client';

import React, { useState } from 'react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { AIActionPanel } from '@/components/ai/AIActionPanel';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useCurrentOrg } from '@/hooks/useOrg';
import { PageSpinner } from '@/components/ui/Spinner';
import type { AIAction } from '@/lib/types';

interface TabDef {
  id: AIAction;
  label: string;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'chat',               label: 'Chat',              description: 'Free-form AI assistant' },
  { id: 'lead_score',         label: 'Lead Scorer',       description: 'Score leads 0–100 with reasoning and a draft email' },
  { id: 'email_generate',     label: 'Email Writer',      description: 'Draft personalised outreach emails' },
  { id: 'ticket_analyze',     label: 'Ticket Analyzer',   description: 'Classify and triage support tickets' },
  { id: 'document_summarize', label: 'Summariser',        description: 'Condense documents to key points' },
  { id: 'predictive_analytics', label: 'Predictive',      description: 'Forecast churn, revenue, and demand' },
  { id: 'vendor_scorecard',   label: 'Vendor Score',      description: 'Evaluate vendor performance objectively' },
  { id: 'workflow_suggest',   label: 'Workflow Ideas',    description: 'Get workflow suggestions for a trigger event' },
  { id: 'inventory_reorder',  label: 'Inventory',         description: 'Identify items that need reordering' },
  { id: 'project_health',     label: 'Project Health',    description: 'Score a project and surface risks' },
  { id: 'sales_forecast',     label: 'Sales Forecast',    description: 'Forecast revenue from pipeline data' },
  { id: 'win_probability',    label: 'Win Probability',   description: 'Estimate the likelihood of closing a deal' },
];

export default function AIPage() {
  const { orgId, isLoading } = useCurrentOrg();
  const [activeTab, setActiveTab] = useState<AIAction>('chat');

  if (isLoading || !orgId) return <PageSpinner message="Loading AI assistant…" />;

  const activeTabDef = TABS.find(t => t.id === activeTab)!;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">AI</div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">
            Classify, summarise, score, draft, and forecast — with your data, governed by your team
          </p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Tabs */}
        <div className="ai-tabs" role="tablist" aria-label="AI actions">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`ai-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          style={{ padding: '1.5rem' }}
        >
          {activeTab !== 'chat' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-faint)',
                  marginBottom: '0.25rem',
                }}
              >
                {activeTabDef.label}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {activeTabDef.description}
              </p>
            </div>
          )}

          {activeTab === 'chat' ? (
            <ChatInterface orgId={orgId} />
          ) : (
            <AIActionPanel orgId={orgId} action={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}
