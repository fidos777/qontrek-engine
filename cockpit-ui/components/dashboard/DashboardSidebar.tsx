"use client";

import * as React from "react";
import type { VerticalId } from "@/lib/verticals/types";
import { verticalRegistry } from "@/lib/verticals";

export interface DashboardSidebarProps {
  currentVertical: VerticalId;
  onVerticalChange?: (verticalId: VerticalId) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({
  currentVertical,
  onVerticalChange,
  collapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const verticals = Object.values(verticalRegistry);

  return (
    <aside
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <span className="font-bold text-lg">Qontrek</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-800 rounded"
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className={`px-4 mb-2 ${collapsed ? "hidden" : ""}`}>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Verticals
          </span>
        </div>
        <ul className="space-y-1 px-2">
          {verticals.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onVerticalChange?.(v.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentVertical === v.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                title={v.name}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${v.color}30` }}
                >
                  <span style={{ color: v.color }}>{v.name.charAt(0)}</span>
                </div>
                {!collapsed && (
                  <span className="truncate">{v.name}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`p-4 border-t border-gray-700 ${collapsed ? "hidden" : ""}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-sm font-medium">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-gray-400 truncate">admin@qontrek.my</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
