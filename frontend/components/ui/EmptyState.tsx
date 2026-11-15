import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        textAlign: 'center',
        gap: 1,
      }}
    >
      <div aria-hidden="true" style={{ fontSize: '2rem', opacity: 0.25, marginBottom: '0.25rem' }}>
        {icon}
      </div>
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, lineHeight: 1.6 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
