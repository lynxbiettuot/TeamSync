import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="input-group">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${error ? 'has-error' : ''} ${className}`}
          {...props}
        />
        {error ? (
          <span className="input-error-msg">{error}</span>
        ) : helperText ? (
          <span className="input-helper-msg">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';