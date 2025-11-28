"use client";

import * as React from "react";
import type { VerticalTemplate, DashboardLayout } from "@/lib/verticals/types";

export interface DashboardHeaderProps {
  template: VerticalTemplate;
  currentDashboard: DashboardLayout | null;
  onDashboardChange?: (dashboardId: string) => void;
}

export function DashboardHeader({
  template,
  currentDashboard,
  onDashboardChange,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: template.color }}
          >
            {template.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {template.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {template.name_ms}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {template.dashboards.length > 1 && (
            <select
              value={currentDashboard?.id || ""}
              onChange={(e) => onDashboardChange?.(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {template.dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh"
          >
            <svg
              className="w-5 h-5"
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
        </div>
      </div>

      {currentDashboard && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {currentDashboard.description}
        </p>
      )}
    </header>
  );
}

export default DashboardHeader;
