'use client';

import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: ReactNode;
  subtitle?: string;
}

export function VoltekKPICard({ title, value, prefix = '', suffix = '', icon, subtitle }: Props) {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('en-MY')
    : value;

  return (
    <Card className="p-4 bg-[var(--bg-surface,#ffffff)] border-[var(--border-default,#e5e7eb)]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[var(--text-2,#6b7280)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-1,#111827)]">
            {prefix}{formattedValue}{suffix}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-2,#6b7280)]">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-[var(--accent,#3b82f6)]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
