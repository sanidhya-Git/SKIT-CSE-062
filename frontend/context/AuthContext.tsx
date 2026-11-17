'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authApi } from '@/lib/api';
import { User } from '@/lib/types';
import { isTokenExpired } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setSession: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback((currentToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Schedule a refresh 2 minutes before expiry
    try {
      const parts = currentToken.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp === 'number') {
        const nowMs = Date.now();
        const expMs = payload.exp * 1000;
        const refreshAt = expMs - 2 * 60 * 1000; // 2 min early
        const delay = Math.max(refreshAt - nowMs, 10_000);
        refreshTimerRef.current = setTimeout(() => {
          authApi
            .refresh()
            .then(res => {
              setToken(res.token);
              setUser(res.user);
              scheduleRefresh(res.token);
            })
            .catch(() => {
              setToken(null);
              setUser(null);
            });
        }, delay);
      }
    } catch {
      // If we can't parse the token, skip scheduling
    }
  }, []);

  // On mount: attempt a silent refresh using the httpOnly cookie
  useEffect(() => {
    setIsLoading(true);
    authApi
      .refresh()
      .then(res => {
        setToken(res.token);
        setUser(res.user);
        scheduleRefresh(res.token);
      })
      .catch(() => {
        // No valid session — that's fine
      })
      .finally(() => setIsLoading(false));

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      setToken(res.token);
      setUser(res.user);
      scheduleRefresh(res.token);
    },
    [scheduleRefresh]
  );

  const setSession = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    scheduleRefresh(newToken);
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await authApi.logout().catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await authApi.refresh();
      setToken(res.token);
      setUser(res.user);
      scheduleRefresh(res.token);
      return res.token;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    }
  }, [scheduleRefresh]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, setSession, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth() {
  const { user, token, isLoading } = useAuth();
  return { user, token, isLoading, isAuthenticated: !!token };
}
