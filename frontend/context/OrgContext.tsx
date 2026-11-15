'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { orgsApi } from '@/lib/api';
import { Organisation } from '@/lib/types';
import { useAuth } from './AuthContext';

interface OrgContextValue {
  orgs: Organisation[];
  currentOrg: Organisation | null;
  isLoading: boolean;
  switchOrg: (orgId: string) => void;
  refreshOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

const ORG_STORAGE_KEY = 'oneops_current_org_id';

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organisation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrgs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await orgsApi.list(token);
      setOrgs(data);

      // Restore previously selected org, or default to first
      const savedId =
        typeof window !== 'undefined' ? sessionStorage.getItem(ORG_STORAGE_KEY) : null;
      const target = savedId ? data.find(o => o.id === savedId) : null;
      setCurrentOrg(target ?? data[0] ?? null);
    } catch {
      setOrgs([]);
      setCurrentOrg(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchOrgs();
    } else {
      setOrgs([]);
      setCurrentOrg(null);
    }
  }, [token, fetchOrgs]);

  const switchOrg = useCallback(
    (orgId: string) => {
      const org = orgs.find(o => o.id === orgId);
      if (org) {
        setCurrentOrg(org);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(ORG_STORAGE_KEY, orgId);
        }
      }
    },
    [orgs]
  );

  return (
    <OrgContext.Provider
      value={{ orgs, currentOrg, isLoading, switchOrg, refreshOrgs: fetchOrgs }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
