import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
  const variantStyles = {
    rect: 'rounded-[1px]',
    circle: 'rounded-full',
    text: 'h-4 w-full rounded-[1px]',
  };

  return (
    <div
      className={twMerge(clsx('bg-line/20 animate-pulse', variantStyles[variant], className))}
      {...props}
    />
  );
}
