import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We ran into an error loading this content. Try again, or check back shortly.',
  onRetry,
}: ErrorStateProps) {
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
      <ErrorOutlineIcon sx={{ fontSize: '2rem', color: 'error.main', opacity: 0.6, mb: 0.5 }} />
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320, lineHeight: 1.6 }}>
        {message}
      </Typography>
      {onRetry && (
        <Box sx={{ mt: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onRetry}
            startIcon={<ReplayIcon fontSize="small" />}
          >
            Try again
          </Button>
        </Box>
      )}
    </Box>
  );
}
