import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-looser text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={twMerge(
              clsx(
                'placeholder:text-muted/60 w-full rounded-[1px] border border-line bg-transparent px-4 py-3 text-sm text-ink transition-colors',
                'focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink',
                'disabled:cursor-not-allowed disabled:bg-cream-soft disabled:opacity-60',
                error && 'border-danger focus:border-danger focus:ring-danger',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
