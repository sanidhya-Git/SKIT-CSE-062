'use client';

import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#1E1E1E',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#64748B',
      light: '#94A3B8',
      dark: '#475569',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      light: '#FEE2E2',
      dark: '#B91C1C',
    },
    warning: {
      main: '#D97706',
      light: '#FEF3C7',
      dark: '#B45309',
    },
    info: {
      main: '#2563EB',
      light: '#DBEAFE',
      dark: '#1D4ED8',
    },
    success: {
      main: '#16A34A',
      light: '#DCFCE7',
      dark: '#15803D',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.01em' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6, color: '#64748B' },
    caption: { fontSize: '0.75rem', color: '#64748B' },
    button: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '-0.01em',
    },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    '0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
    '0 4px 16px rgba(0,0,0,0.1)',
    '0 8px 24px rgba(0,0,0,0.1)',
    '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
    '0 12px 40px rgba(0,0,0,0.12)',
    '0 16px 48px rgba(0,0,0,0.14)',
    '0 20px 56px rgba(0,0,0,0.14)',
    '0 24px 64px rgba(0,0,0,0.16)',
    '0 28px 72px rgba(0,0,0,0.16)',
    '0 32px 80px rgba(0,0,0,0.18)',
    '0 36px 88px rgba(0,0,0,0.18)',
    '0 40px 96px rgba(0,0,0,0.2)',
    '0 44px 104px rgba(0,0,0,0.2)',
    '0 48px 112px rgba(0,0,0,0.22)',
    '0 52px 120px rgba(0,0,0,0.22)',
    '0 56px 128px rgba(0,0,0,0.24)',
    '0 60px 136px rgba(0,0,0,0.24)',
    '0 64px 144px rgba(0,0,0,0.26)',
    '0 68px 152px rgba(0,0,0,0.26)',
    '0 72px 160px rgba(0,0,0,0.28)',
    '0 76px 168px rgba(0,0,0,0.28)',
    '0 80px 176px rgba(0,0,0,0.3)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&:active': { boxShadow: 'none' },
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#000000',
            '&:hover': { backgroundColor: '#1E1E1E' },
          },
          '&.MuiButton-outlinedPrimary': {
            borderColor: '#E2E8F0',
            color: '#0F172A',
            '&:hover': {
              backgroundColor: '#F8FAFC',
              borderColor: '#CBD5E1',
            },
          },
        },
        sizeMedium: { padding: '7px 16px', fontSize: '0.875rem' },
        sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '10px 24px', fontSize: '0.9375rem' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 6,
            fontSize: '0.875rem',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#CBD5E1' },
            '&.Mui-focused fieldset': { borderColor: '#000000', borderWidth: 1 },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            color: '#64748B',
            '&.Mui-focused': { color: '#000000' },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.03em',
          height: 22,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8FAFC',
            color: '#64748B',
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            borderBottom: '1px solid #E2E8F0',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: '#F8FAFC',
          },
          '& .MuiTableCell-body': {
            fontSize: '0.875rem',
            color: '#0F172A',
            padding: '14px 16px',
            borderBottom: '1px solid #F1F5F9',
          },
          '& .MuiTableRow-root:last-child .MuiTableCell-body': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '5px 10px',
        },
        arrow: { color: '#0F172A' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          fontWeight: 600,
          padding: '18px 24px 14px',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '24px' } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '14px 24px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&:hover': { backgroundColor: '#F8FAFC' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0,0,0,0.04)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.06)' },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#000000',
            borderWidth: 1,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': { backgroundColor: '#CBD5E1' },
          '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#000000 !important' },
          '& .Mui-checked .MuiSwitch-thumb': { backgroundColor: '#000000' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: '#E2E8F0', borderRadius: 100 },
        bar: { backgroundColor: '#000000', borderRadius: 100 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid',
          fontSize: '0.875rem',
          '&.MuiAlert-standardSuccess': {
            backgroundColor: 'rgba(22, 163, 74, 0.08)',
            borderColor: 'rgba(22, 163, 74, 0.2)',
            color: '#15803D',
          },
          '&.MuiAlert-standardError': {
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            borderColor: 'rgba(220, 38, 38, 0.2)',
            color: '#B91C1C',
          },
          '&.MuiAlert-standardWarning': {
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            borderColor: 'rgba(217, 119, 6, 0.2)',
            color: '#B45309',
          },
          '&.MuiAlert-standardInfo': {
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            borderColor: 'rgba(37, 99, 235, 0.2)',
            color: '#1D4ED8',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb:hover': { background: '#CBD5E1' },
        },
      },
    },
  },
});
