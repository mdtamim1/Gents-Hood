import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary-link' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none rounded-[1px]';

    const variantStyles = {
      primary: 'bg-ink text-cream hover:bg-ink-soft active:scale-[0.99]',
      'secondary-link':
        'bg-transparent text-ink underline underline-offset-4 decoration-1 hover:opacity-75 p-0 h-auto tracking-widest',
      outline: 'border border-ink bg-transparent text-ink hover:bg-ink hover:text-cream',
      ghost: 'bg-transparent text-ink hover:bg-cream-soft',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-[10px] tracking-looser',
      md: 'px-8 py-3.5 text-[11px] tracking-looser',
      lg: 'px-10 py-4 text-xs tracking-looser',
    };

    const finalSizeStyles = variant === 'secondary-link' ? '' : sizeStyles[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variantStyles[variant], finalSizeStyles, className))}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-3.5 w-3.5 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
