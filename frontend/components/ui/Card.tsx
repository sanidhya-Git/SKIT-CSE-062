import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <Paper
      elevation={1}
      className={className}
      style={style}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {children}
    </Paper>
  );
}

export function CardHeader({ title, subtitle, actions }: CardHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.125rem 1.5rem',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <Typography
          variant="h6"
          sx={{ fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'text.primary' }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card-body ${className}`} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '0.875rem 1.5rem',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface-hover)',
      }}
    >
      {children}
    </div>
  );
}
