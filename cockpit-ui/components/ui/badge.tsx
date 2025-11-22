import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-900 text-white',
    secondary: 'bg-gray-100 text-gray-900',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-200 text-gray-900',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
