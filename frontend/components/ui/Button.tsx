'use client';

import React from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const MUI_VARIANT: Record<ButtonVariant, 'contained' | 'outlined' | 'text'> = {
  primary:   'contained',
  secondary: 'outlined',
  danger:    'contained',
  ghost:     'text',
};

const MUI_SIZE: Record<ButtonSize, 'small' | 'medium' | 'large'> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  children,
  className = '',
  disabled,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDanger = variant === 'danger';

  return (
    <MuiButton
      variant={MUI_VARIANT[variant]}
      size={MUI_SIZE[size]}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      type={type as 'button' | 'submit' | 'reset'}
      className={className}
      color={isDanger ? 'error' : 'primary'}
      startIcon={
        loading ? (
          <CircularProgress
            size={14}
            sx={{ color: variant === 'primary' ? 'white' : 'currentColor' }}
          />
        ) : undefined
      }
      sx={{
        ...(variant === 'ghost' && {
          color: 'text.secondary',
          '&:hover': { backgroundColor: 'grey.100', color: 'text.primary' },
        }),
        ...(iconOnly && {
          minWidth: 'unset',
          px: MUI_SIZE[size] === 'small' ? 0.75 : MUI_SIZE[size] === 'large' ? 1.25 : 1,
        }),
      }}
    >
      {!iconOnly && children}
      {iconOnly && children}
    </MuiButton>
  );
}
