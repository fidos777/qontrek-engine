'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface VoltekKPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  prefix?: string;  // e.g., "RM"
  suffix?: string;  // e.g., "%"
}

export function VoltekKPICard({
  title,
  value,
  subtitle,
  icon,
  className,
  prefix,
  suffix,
}: VoltekKPICardProps) {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('en-MY')
    : value;

  return (
    <Card className={cn('p-4 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{title}</div>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>

      <div className="text-2xl font-bold text-gray-900">
        {prefix}{formattedValue}{suffix}
      </div>

      {subtitle && (
        <div className="text-xs text-gray-500">{subtitle}</div>
      )}
    </Card>
  );
}
