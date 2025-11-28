"use client";

import * as React from "react";

export interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function WidgetCard({
  title,
  subtitle,
  loading = false,
  error,
  children,
  className = "",
}: WidgetCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-500">
            <svg
              className="w-8 h-8 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default WidgetCard;
