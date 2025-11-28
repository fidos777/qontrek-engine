"use client";

import * as React from 'react';
import { Card } from '@/components/ui/card';

interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
}

export function WidgetCard({
  title,
  subtitle,
  loading,
  error,
  children,
  className = '',
  onRefresh,
}: WidgetCardProps) {
  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
          <div className="text-red-500 text-sm font-medium mb-2">Error</div>
          <div className="text-gray-500 text-xs text-center">{error}</div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      {(title || onRefresh) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && (
              <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
              title="Refresh"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className={loading ? 'opacity-50' : ''}>{children}</div>
    </Card>
  );
}
