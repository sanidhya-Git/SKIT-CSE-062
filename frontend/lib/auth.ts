import { UserRole } from './types';

/**
 * Decode a JWT payload without verification.
 * Only used client-side to read non-sensitive fields (userId, role, exp).
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT token is expired (or within `bufferSecs` of expiry).
 */
export function isTokenExpired(token: string, bufferSecs = 30): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const nowSecs = Math.floor(Date.now() / 1000);
  return payload.exp - nowSecs < bufferSecs;
}

/**
 * Get the user ID from a token.
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return (payload.sub as string) ?? (payload.userId as string) ?? null;
}

// ─── Role hierarchy ───────────────────────────────────────────────────────
const ROLE_RANK: Record<UserRole, number> = {
  super_admin: 100,
  org_owner: 80,
  org_admin: 70,
  workflow_builder: 50,
  manager: 40,
  employee: 20,
  auditor: 10,
};

/**
 * Returns true if the given role meets the minimum required role.
 */
export function hasRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[minimumRole] ?? 0);
}

/**
 * Returns true if the user can manage workflows (create, edit, publish).
 */
export function canManageWorkflows(role: UserRole): boolean {
  return hasRole(role, 'workflow_builder');
}

/**
 * Returns true if the user can approve workflow steps.
 */
export function canApprove(role: UserRole): boolean {
  return hasRole(role, 'manager');
}

/**
 * Returns true if the user can manage organisation settings and members.
 */
export function canManageOrg(role: UserRole): boolean {
  return hasRole(role, 'org_admin');
}

/**
 * Returns true if the user can view audit logs.
 */
export function canViewAudit(role: UserRole): boolean {
  return hasRole(role, 'auditor');
}

/**
 * Human-readable label for a role.
 */
export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    org_owner: 'Owner',
    org_admin: 'Admin',
    workflow_builder: 'Builder',
    manager: 'Manager',
    employee: 'Employee',
    auditor: 'Auditor',
  };
  return labels[role] ?? role;
}
