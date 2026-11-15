'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { integrationsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusDot } from '@/components/ui/StatusDot';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Integration, IntegrationType } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

interface ConnectorDef {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  fields: { key: string; label: string; type: string; placeholder?: string }[];
}

const CONNECTORS: ConnectorDef[] = [
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send messages, post to channels, and respond to events.',
    icon: '💬',
    fields: [{ key: 'botToken', label: 'Bot token', type: 'password', placeholder: 'xoxb-…' }],
  },
  {
    type: 'github',
    name: 'GitHub',
    description: 'Create issues, pull requests, and trigger actions on code events.',
    icon: '🐙',
    fields: [
      { key: 'personalAccessToken', label: 'Personal access token', type: 'password' },
      { key: 'organisation', label: 'Organisation / user', type: 'text', placeholder: 'my-org' },
    ],
  },
  {
    type: 'jira',
    name: 'Jira',
    description: 'Create and update tickets, link sprints, and automate project workflows.',
    icon: '📋',
    fields: [
      { key: 'domain', label: 'Jira domain', type: 'text', placeholder: 'your-org.atlassian.net' },
      { key: 'email', label: 'Account email', type: 'email' },
      { key: 'apiToken', label: 'API token', type: 'password' },
    ],
  },
  {
    type: 'salesforce',
    name: 'Salesforce',
    description: 'Read and write CRM records, trigger flows on lead and deal events.',
    icon: '☁',
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', placeholder: 'https://your-org.salesforce.com' },
      { key: 'clientId', label: 'Connected app client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client secret', type: 'password' },
    ],
  },
  {
    type: 'email',
    name: 'Email (SMTP)',
    description: 'Send notification and transactional emails through your SMTP server.',
    icon: '✉',
    fields: [
      { key: 'host', label: 'SMTP host', type: 'text', placeholder: 'smtp.yourcompany.com' },
      { key: 'port', label: 'Port', type: 'number', placeholder: '587' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and automate CRM actions.',
    icon: '🔶',
    fields: [{ key: 'privateAppToken', label: 'Private app token', type: 'password' }],
  },
  {
    type: 'zendesk',
    name: 'Zendesk',
    description: 'Create and update support tickets and track customer interactions.',
    icon: '🎧',
    fields: [
      { key: 'subdomain', label: 'Subdomain', type: 'text', placeholder: 'yourcompany' },
      { key: 'email', label: 'Agent email', type: 'email' },
      { key: 'apiToken', label: 'API token', type: 'password' },
    ],
  },
  {
    type: 'linear',
    name: 'Linear',
    description: 'Create issues, link to projects, and automate engineering workflows.',
    icon: '◈',
    fields: [{ key: 'apiKey', label: 'API key', type: 'password' }],
  },
];

export default function IntegrationsPage() {
  const { token } = useAuth();
  const { orgId } = useCurrentOrg();
  const { showToast } = useToast();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorDef | null>(null);
  const [configFields, setConfigFields] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<Integration | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const data = await integrationsApi.list(token, orgId);
      setIntegrations(data);
    } catch {
      setError('Could not load integrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId]);

  useEffect(() => { load(); }, [load]);

  const connectedTypes = new Set(integrations.map(i => i.type));

  const openConnect = (connector: ConnectorDef) => {
    setSelectedConnector(connector);
    setConfigFields({});
    setDisplayName(connector.name);
    setConnectOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedConnector || !token || !orgId) return;
    setConnectLoading(true);
    try {
      await integrationsApi.create(token, orgId, selectedConnector.type, displayName, configFields);
      showToast('success', 'Connected', `${selectedConnector.name} is now connected.`);
      setConnectOpen(false);
      load();
    } catch (err) {
      showToast('error', 'Connection failed', getErrorMessage(err));
    } finally {
      setConnectLoading(false);
    }
  };

  const handleTest = async (integration: Integration) => {
    if (!token || !orgId) return;
    setTestingId(integration.id);
    try {
      const result = await integrationsApi.test(token, orgId, integration.id);
      if (result.success) {
        showToast('success', 'Connection healthy', result.message || 'Test passed.');
      } else {
        showToast('warning', 'Test failed', result.message || 'The connection test did not succeed.');
      }
    } catch (err) {
      showToast('error', 'Test failed', getErrorMessage(err));
    } finally {
      setTestingId(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget || !token || !orgId) return;
    setDisconnectLoading(true);
    try {
      await integrationsApi.delete(token, orgId, disconnectTarget.id);
      showToast('success', 'Disconnected', `${disconnectTarget.name} has been removed.`);
      setDisconnectTarget(null);
      load();
    } catch (err) {
      showToast('error', 'Could not disconnect', getErrorMessage(err));
    } finally {
      setDisconnectLoading(false);
    }
  };

  if (loading) return <PageSpinner message="Loading integrations…" />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Platform</div>
          <h1 className="page-title">Integrations</h1>
          <p className="page-subtitle">Connect your business systems to build workflows across them</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Connected integrations */}
      {integrations.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-faint)',
              marginBottom: '0.75rem',
            }}
          >
            Connected
          </h2>
          <div className="integration-grid">
            {integrations.map(integration => {
              const def = CONNECTORS.find(c => c.type === integration.type);
              return (
                <div key={integration.id} className="integration-card connected">
                  <div className="integration-card-header">
                    <div className="integration-logo" aria-hidden="true">
                      {def?.icon ?? '⚙'}
                    </div>
                    <div className="integration-info">
                      <div className="integration-name">{integration.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                        <StatusDot status={integration.status} showLabel />
                      </div>
                    </div>
                  </div>
                  <div className="integration-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTest(integration)}
                      loading={testingId === integration.id}
                    >
                      Test
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDisconnectTarget(integration)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connector catalog */}
      <div>
        <h2
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-faint)',
            marginBottom: '0.75rem',
          }}
        >
          Available connectors
        </h2>
        <div className="integration-grid">
          {CONNECTORS.map(connector => {
            const isConnected = connectedTypes.has(connector.type);
            return (
              <div
                key={connector.type}
                className="integration-card"
                style={isConnected ? { opacity: 0.6 } : {}}
              >
                <div className="integration-card-header">
                  <div className="integration-logo" aria-hidden="true">{connector.icon}</div>
                  <div className="integration-info">
                    <div className="integration-name">{connector.name}</div>
                    <div className="integration-desc">{connector.description}</div>
                  </div>
                </div>
                <div className="integration-actions">
                  {isConnected ? (
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      ✓ Connected
                    </span>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => openConnect(connector)}>
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connect modal */}
      {selectedConnector && (
        <Modal
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          title={`Connect ${selectedConnector.name}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConnectOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConnect} loading={connectLoading}>
                Connect
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              hint="A friendly name for this connection."
            />
            {selectedConnector.fields.map(field => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type as React.InputHTMLAttributes<HTMLInputElement>['type']}
                placeholder={field.placeholder}
                value={configFields[field.key] ?? ''}
                onChange={e =>
                  setConfigFields(prev => ({ ...prev, [field.key]: e.target.value }))
                }
                autoComplete="off"
              />
            ))}
          </div>
        </Modal>
      )}

      {/* Disconnect confirm */}
      <ConfirmDialog
        open={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleDisconnect}
        title="Disconnect integration"
        description={`Disconnecting "${disconnectTarget?.name}" will stop all workflows that depend on it. This action cannot be undone.`}
        confirmLabel="Disconnect"
        confirmVariant="danger"
        loading={disconnectLoading}
      />
    </div>
  );
}
