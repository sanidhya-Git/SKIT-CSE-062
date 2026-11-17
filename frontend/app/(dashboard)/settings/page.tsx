'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { orgsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCurrentOrg } from '@/hooks/useOrg';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OrgMember, UserRole } from '@/lib/types';
import { getErrorMessage, getInitials } from '@/lib/utils';
import { roleLabel as rl } from '@/lib/auth';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'builder', label: 'Builder' },
  { value: 'approver', label: 'Approver' },
  { value: 'operator', label: 'Operator' },
  { value: 'auditor', label: 'Auditor' },
];

export default function SettingsPage() {
  const { token, user } = useAuth();
  const { org, refreshOrgs } = useCurrentOrg();
  const { showToast } = useToast();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('operator');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [roleChanges, setRoleChanges] = useState<Record<string, UserRole>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const orgId = org?.id;

  const loadMembers = useCallback(async () => {
    if (!token || !orgId) return;
    setLoading(true);
    setError('');
    try {
      const res = await orgsApi.getMembers(token, orgId);
      setMembers(res.data);
    } catch {
      setError('Could not load members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, orgId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleInvite = async () => {
    if (!token || !orgId) return;
    if (!inviteEmail.trim()) {
      showToast('error', 'Email required', 'Enter the email address to invite.');
      return;
    }
    setInviteLoading(true);
    try {
      await orgsApi.addMember(token, orgId, inviteEmail.trim(), inviteRole);
      showToast('success', 'Invitation sent', `${inviteEmail} has been invited as ${rl(inviteRole)}.`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('operator');
      loadMembers();
    } catch (err) {
      showToast('error', 'Could not invite member', getErrorMessage(err));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (member: OrgMember, role: UserRole) => {
    if (!token || !orgId) return;
    setSavingRole(member.userId);
    try {
      await orgsApi.updateMember(token, orgId, member.userId, role);
      showToast('success', 'Role updated', `${member.user.name}'s role is now ${rl(role)}.`);
      loadMembers();
    } catch (err) {
      showToast('error', 'Could not update role', getErrorMessage(err));
    } finally {
      setSavingRole(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget || !token || !orgId) return;
    setRemoveLoading(true);
    try {
      await orgsApi.removeMember(token, orgId, removeTarget.userId);
      showToast('success', 'Member removed', `${removeTarget.user.name} has been removed.`);
      setRemoveTarget(null);
      loadMembers();
    } catch (err) {
      showToast('error', 'Could not remove member', getErrorMessage(err));
    } finally {
      setRemoveLoading(false);
    }
  };

  if (loading) return <PageSpinner message="Loading settings…" />;

  return (
    <div style={{ maxWidth: '760px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-eyebrow">Admin</div>
          <h1 className="page-title">Settings</h1>
        </div>
      </div>

      {/* Org info */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-title">Organisation</div>
          <div className="settings-section-desc">Your workspace name and identifier</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Name" value={org?.name ?? ''} readOnly />
          <Input label="Slug" value={org?.slug ?? ''} readOnly hint="Used in API calls and URLs." />
        </div>
      </div>

      {/* Members */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div className="settings-section-title">Members</div>
              <div className="settings-section-desc">
                {members.length} member{members.length !== 1 ? 's' : ''} in this organisation
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
              + Invite member
            </Button>
          </div>
        </div>

        {error && <ErrorState message={error} onRetry={loadMembers} />}

        {!error && members.length === 0 && (
          <EmptyState
            icon="👥"
            title="No other members yet"
            description="Invite your team to collaborate on workflows."
          />
        )}

        {!error && members.length > 0 && (
          <div>
            {members.map(member => (
              <div key={member.userId} className="member-row">
                <div className="member-avatar" aria-hidden="true">
                  {getInitials(member.user.name)}
                </div>
                <div className="member-info">
                  <div className="member-name">
                    {member.user.name}
                    {member.userId === user?.id && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.6875rem',
                          color: 'var(--accent)',
                          fontWeight: 500,
                        }}
                      >
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="member-email">{member.user.email}</div>
                </div>
                <div className="member-actions">
                  {member.userId !== user?.id && member.role !== 'owner' ? (
                    <>
                      <select
                        className="form-select"
                        value={member.role}
                        onChange={e => handleRoleChange(member, e.target.value as UserRole)}
                        disabled={savingRole === member.userId}
                        style={{ width: 'auto', fontSize: '0.8125rem' }}
                        aria-label={`Role for ${member.user.name}`}
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setRemoveTarget(member)}
                        aria-label={`Remove ${member.user.name}`}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        padding: '0.375rem 0.5rem',
                      }}
                    >
                      {rl(member.role)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteEmail(''); setInviteRole('operator'); }}
        title="Invite a team member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInvite} loading={inviteLoading}>
              Send invitation
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            autoFocus
          />
          <Select
            label="Role"
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as UserRole)}
            options={ROLE_OPTIONS}
            hint="Roles control what the member can see and do. You can change this later."
          />
        </div>
      </Modal>

      {/* Remove confirm */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove member"
        description={`${removeTarget?.user.name} will lose access to this organisation immediately.`}
        confirmLabel="Remove member"
        confirmVariant="danger"
        loading={removeLoading}
      />
    </div>
  );
}
