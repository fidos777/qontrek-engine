"use client";

import * as React from 'react';
import { Card } from '@/components/ui/card';

type SkeletonVariant = 'kpi' | 'chart' | 'table' | 'list' | 'default';

interface WidgetSkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

export function WidgetSkeleton({
  variant = 'default',
  className = '',
}: WidgetSkeletonProps) {
  const renderContent = () => {
    switch (variant) {
      case 'kpi':
        return (
          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-8 w-32" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-32" />
            <div className="flex items-end gap-2 h-32">
              <SkeletonPulse className="flex-1 h-16" />
              <SkeletonPulse className="flex-1 h-24" />
              <SkeletonPulse className="flex-1 h-20" />
              <SkeletonPulse className="flex-1 h-28" />
              <SkeletonPulse className="flex-1 h-12" />
              <SkeletonPulse className="flex-1 h-32" />
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-32" />
            <div className="space-y-2">
              <SkeletonPulse className="h-8 w-full" />
              <SkeletonPulse className="h-8 w-full" />
              <SkeletonPulse className="h-8 w-full" />
              <SkeletonPulse className="h-8 w-full" />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-32" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonPulse className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-4 w-3/4" />
                  <SkeletonPulse className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SkeletonPulse className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-4 w-2/3" />
                  <SkeletonPulse className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-4 w-1/2" />
            <SkeletonPulse className="h-20 w-full" />
          </div>
        );
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      {renderContent()}
    </Card>
  );
}
