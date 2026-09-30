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
      primary:
        'group/btn relative overflow-hidden bg-[#4A0E17] text-cream hover:bg-[#3B0B12] active:scale-95 shadow-[0_2px_10px_rgba(74,14,23,0.3)] hover:shadow-[0_0_20px_rgba(74,14,23,0.65)] hover:animate-gaming-glow',
      'secondary-link':
        'bg-transparent text-ink underline underline-offset-4 decoration-1 hover:opacity-75 p-0 h-auto tracking-widest',
      outline:
        'group/btn relative overflow-hidden border border-[#4A0E17] bg-transparent text-[#4A0E17] hover:bg-[#4A0E17] hover:text-cream active:scale-95 hover:shadow-[0_0_18px_rgba(74,14,23,0.5)] hover:animate-gaming-glow',
      ghost: 'bg-transparent text-ink hover:bg-cream-soft active:scale-95',
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
        {(variant === 'primary' || variant === 'outline') && (
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
        )}
        <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
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
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
