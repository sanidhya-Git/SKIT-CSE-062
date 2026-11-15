import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  icon?: string;
  accentColor?: string;
}

export function MetricCard({ label, value, trend, icon, accentColor }: MetricCardProps) {
  const trendColor =
    trend?.direction === 'up' ? '#16A34A' :
    trend?.direction === 'down' ? '#DC2626' : '#64748B';

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: 'grey.300',
        },
      }}
    >
      {icon && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            fontSize: '1.375rem',
            opacity: 0.1,
            lineHeight: 1,
          }}
        >
          {icon}
        </div>
      )}

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontSize: '0.6875rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'text.secondary',
          mb: 1.25,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="h4"
        component="div"
        sx={{
          fontSize: '1.875rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: accentColor ?? 'text.primary',
          lineHeight: 1,
          mb: 0.75,
        }}
      >
        {value}
      </Typography>

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: trendColor, fontSize: '0.8125rem', fontWeight: 500 }}>
          {trend.direction === 'up' && <TrendingUpIcon sx={{ fontSize: '1rem' }} />}
          {trend.direction === 'down' && <TrendingDownIcon sx={{ fontSize: '1rem' }} />}
          {trend.direction === 'neutral' && <TrendingFlatIcon sx={{ fontSize: '1rem' }} />}
          <span>{Math.abs(trend.value)}%</span>
          <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '0.75rem' }}>vs last period</span>
        </div>
      )}
    </Paper>
  );
}
