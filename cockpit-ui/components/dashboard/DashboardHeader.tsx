"use client";

import * as React from "react";
import type { VerticalMeta, DashboardDefinition } from "@/lib/verticals/types";

export interface DashboardHeaderProps {
  vertical: VerticalMeta;
  dashboard?: DashboardDefinition;
  onDashboardChange?: (dashboardId: string) => void;
  dashboards?: DashboardDefinition[];
  className?: string;
}

/**
 * Dashboard header with vertical info and dashboard selector
 */
export function DashboardHeader({
  vertical,
  dashboard,
  onDashboardChange,
  dashboards = [],
  className = "",
}: DashboardHeaderProps) {
  return (
    <header className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Vertical Info */}
          <div className="flex items-center gap-3">
            {/* Vertical icon/color indicator */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${vertical.color}20` }}
            >
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: vertical.color }}
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {vertical.name}
              </h1>
              {dashboard && (
                <p className="text-sm text-gray-500">{dashboard.name}</p>
              )}
            </div>
          </div>

          {/* Dashboard Tabs */}
          {dashboards.length > 1 && (
            <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {dashboards.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onDashboardChange?.(d.id)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      dashboard?.id === d.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {d.name}
                </button>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Demo mode badge */}
            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
              DEMO MODE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
