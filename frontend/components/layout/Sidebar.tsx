'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentOrg } from '@/hooks/useOrg';
import Tooltip from '@mui/material/Tooltip';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/overview',     label: 'Overview',      icon: <DashboardOutlinedIcon sx={{ fontSize: '1.125rem' }} />, exact: true },
  { href: '/workflows',    label: 'Workflows',     icon: <AccountTreeOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
  { href: '/runs',         label: 'Runs',          icon: <PlayCircleOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
  { href: '/approvals',    label: 'Approvals',     icon: <CheckCircleOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
  { href: '/integrations', label: 'Integrations',  icon: <ExtensionOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
  { href: '/ai',           label: 'AI Assistant',  icon: <AutoAwesomeOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/analytics', label: 'Analytics', icon: <BarChartOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
  { href: '/settings',  label: 'Settings',  icon: <SettingsOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
  { href: '/admin',     label: 'Audit Log', icon: <ArticleOutlinedIcon sx={{ fontSize: '1.125rem' }} /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { org, orgs, switchOrg } = useCurrentOrg();
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <Link href="/overview" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo-mark">O</div>
        <span className="sidebar-logo-text">
          One<span>Ops</span>
        </span>
      </Link>

      {/* Org switcher */}
      <div className="sidebar-org">
        <div className="sidebar-org-label">Organisation</div>
        <div style={{ position: 'relative' }}>
          <button
            className="sidebar-org-selector"
            onClick={() => setShowOrgMenu(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={showOrgMenu && orgs.length > 1}
          >
            <FiberManualRecordIcon sx={{ fontSize: '0.5rem', color: '#22C55E', flexShrink: 0 }} />
            <span className="sidebar-org-name">{org?.name ?? 'No organisation'}</span>
            <ExpandMoreIcon sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', ml: 'auto' }} />
          </button>
          {showOrgMenu && orgs.length > 1 && (
            <div
              role="listbox"
              aria-label="Switch organisation"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                overflow: 'hidden',
                zIndex: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {orgs.map(o => (
                <button
                  key={o.id}
                  role="option"
                  aria-selected={o.id === org?.id}
                  onClick={() => {
                    switchOrg(o.id);
                    setShowOrgMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    background: o.id === org?.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    color: o.id === org?.id ? '#fff' : 'rgba(255,255,255,0.65)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'background 0.15s',
                  }}
                >
                  {o.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Primary nav */}
      <div className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Tooltip key={item.href} title={item.label} placement="right" arrow>
              <Link
                href={item.href}
                className={`sidebar-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </Tooltip>
          );
        })}

        <div className="sidebar-section-label">Admin</div>

        {SECONDARY_NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Tooltip key={item.href} title={item.label} placement="right" arrow>
              <Link
                href={item.href}
                className={`sidebar-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </Tooltip>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          OneOps AI v0.1
        </div>
      </div>
    </nav>
  );
}
