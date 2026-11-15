'use client';

import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, required, className = '', id, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group">
        {label && (
          <label
            htmlFor={selectId}
            className={`form-label${required ? ' required' : ''}`}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`form-select${error ? ' error' : ''} ${className}`}
          aria-invalid={!!error}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="form-error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && <span className="form-hint">{hint}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
