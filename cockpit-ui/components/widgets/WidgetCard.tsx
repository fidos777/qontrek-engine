"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

export interface WidgetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  noPadding?: boolean;
}

/**
 * Base card wrapper for all widgets with consistent styling
 */
export function WidgetCard({
  title,
  subtitle,
  actions,
  loading,
  error,
  noPadding,
  children,
  className = "",
  ...props
}: WidgetCardProps) {
  return (
    <Card
      className={`flex flex-col h-full overflow-hidden ${className}`}
      {...props}
    >
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 ${noPadding ? "" : "p-4"} ${loading ? "animate-pulse" : ""}`}>
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 text-sm font-medium mb-1">Error loading widget</div>
              <div className="text-gray-500 text-xs">{error}</div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
