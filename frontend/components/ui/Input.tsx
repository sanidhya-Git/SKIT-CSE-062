'use client';

import React, { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
  name?: string;
  autoFocus?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  rows?: number;
  multiline?: boolean;
  readOnly?: boolean;
  style?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, id, className, min, max, step, autoFocus, readOnly, style, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const slotInputProps: TextFieldProps['slotProps'] = {};
    if (min !== undefined || max !== undefined || step !== undefined || autoFocus || readOnly) {
      slotInputProps.htmlInput = {
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
        ...(step !== undefined && { step }),
        ...(autoFocus && { autoFocus }),
        ...(readOnly && { readOnly }),
      };
    }

    return (
      <TextField
        label={label}
        id={inputId}
        error={!!error}
        helperText={error ?? hint}
        required={required}
        fullWidth
        size="small"
        className={className}
        inputRef={ref}
        slotProps={Object.keys(slotInputProps).length > 0 ? slotInputProps : undefined}
        style={style}
        {...(props as Omit<TextFieldProps, 'label' | 'error' | 'helperText' | 'required' | 'id' | 'fullWidth' | 'size' | 'className' | 'inputRef' | 'slotProps' | 'style'>)}
      />
    );
  }
);

Input.displayName = 'Input';
