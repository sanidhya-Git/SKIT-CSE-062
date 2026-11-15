'use client';

import { useOrg } from '@/context/OrgContext';

/**
 * Convenience hook that returns the current organisation and its ID.
 * Throws if used outside OrgProvider.
 */
export function useCurrentOrg() {
  const { currentOrg, orgs, switchOrg, isLoading, refreshOrgs } = useOrg();
  return {
    org: currentOrg,
    orgId: currentOrg?.id ?? null,
    orgs,
    switchOrg,
    isLoading,
    refreshOrgs,
  };
}
