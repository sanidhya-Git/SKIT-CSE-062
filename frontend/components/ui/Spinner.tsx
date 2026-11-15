import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE_MAP = { sm: 16, md: 24, lg: 40 } as const;

export function Spinner({ size = 'md', label = 'Loading…' }: SpinnerProps) {
  return (
    <CircularProgress
      size={SIZE_MAP[size]}
      thickness={4}
      role="status"
      aria-label={label}
      sx={{ color: 'text.primary' }}
    />
  );
}

export function PageSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <CircularProgress size={36} thickness={3.5} sx={{ color: 'text.primary' }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </div>
  );
}
