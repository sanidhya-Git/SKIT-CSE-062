'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const PAGE_TITLES: Record<string, string> = {
  '/overview':     'Overview',
  '/workflows':    'Workflows',
  '/runs':         'Runs',
  '/approvals':    'Approvals',
  '/integrations': 'Integrations',
  '/ai':           'AI Assistant',
  '/analytics':    'Analytics',
  '/settings':     'Settings',
  '/admin':        'Audit Log',
};

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title;
  }
  return 'OneOps';
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const title = getPageTitle(pathname);
  const menuOpen = Boolean(anchorEl);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    router.push('/login');
  };

  return (
    <header className="topbar" role="banner">
      <div>
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <Tooltip title="Notifications" arrow>
          <IconButton
            size="small"
            aria-label="Notifications"
            sx={{
              width: 34,
              height: 34,
              borderRadius: '6px',
              border: '1px solid transparent',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'grey.100',
                borderColor: 'divider',
                color: 'text.primary',
              },
            }}
          >
            <NotificationsNoneIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* User menu button */}
        <button
          className="topbar-user-btn"
          onClick={e => setAnchorEl(e.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="User menu"
        >
          <Avatar
            sx={{
              width: 26,
              height: 26,
              fontSize: '0.6875rem',
              fontWeight: 700,
              bgcolor: '#000000',
              color: '#fff',
            }}
          >
            {user ? getInitials(user.name) : '?'}
          </Avatar>
          <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
            {user?.name ?? 'Account'}
          </span>
          <KeyboardArrowDownIcon sx={{ fontSize: '1rem', color: 'text.disabled', ml: -0.25 }} />
        </button>

        {/* Dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          onClick={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              elevation: 3,
              sx: {
                mt: 0.75,
                minWidth: 220,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'visible',
              },
            },
          }}
        >
          {/* User info header */}
          <div style={{ padding: '12px 16px 10px' }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {user?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block' }}
            >
              {user?.email}
            </Typography>
          </div>

          <Divider />

          <MenuItem
            onClick={() => { router.push('/settings'); setAnchorEl(null); }}
            sx={{ gap: 1.5, py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 'auto !important' }}>
              <SettingsOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </ListItemIcon>
            <Typography variant="body2">Settings</Typography>
          </MenuItem>

          <MenuItem
            onClick={handleLogout}
            sx={{ gap: 1.5, py: 1, color: 'error.main' }}
          >
            <ListItemIcon sx={{ minWidth: 'auto !important' }}>
              <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <Typography variant="body2" sx={{ color: 'error.main' }}>Sign out</Typography>
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
}
