"use client";

import * as React from "react";
import Link from "next/link";
import type { VerticalMeta } from "@/lib/verticals/types";

export interface DashboardSidebarProps {
  verticals: VerticalMeta[];
  activeVertical?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Dashboard navigation sidebar
 */
export function DashboardSidebar({
  verticals,
  activeVertical,
  collapsed = false,
  onToggle,
  className = "",
}: DashboardSidebarProps) {
  // Icon mapping for verticals
  const getVerticalIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      sun: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      shield: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      "shopping-cart": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      truck: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l3-6h10l4 6M3 9v8h1M3 9h18m0 0v8h-1" />
        </svg>
      ),
      factory: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      "heart-pulse": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    };
    return icons[icon] || icons.sun;
  };

  return (
    <aside
      className={`
        bg-gray-900 text-white flex flex-col transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        ${className}
      `}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-lg">Qontrek</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className={`text-xs text-gray-500 uppercase tracking-wider ${collapsed ? "text-center" : "px-3"} mb-2`}>
          {collapsed ? "V" : "Verticals"}
        </div>

        {verticals.map((vertical) => {
          const isActive = activeVertical === vertical.id;

          return (
            <Link
              key={vertical.id}
              href={`/v/${vertical.id}`}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }
              `}
              title={collapsed ? vertical.name : undefined}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${vertical.color}30` }}
              >
                <span style={{ color: vertical.color }}>
                  {getVerticalIcon(vertical.icon)}
                </span>
              </div>
              {!collapsed && (
                <span className="truncate">{vertical.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          href="/dashboard/governance"
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg
            text-gray-400 hover:bg-gray-800 hover:text-white transition-colors
          `}
          title={collapsed ? "Governance" : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {!collapsed && <span>Governance</span>}
        </Link>

        <Link
          href="/cfo"
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg
            text-gray-400 hover:bg-gray-800 hover:text-white transition-colors
          `}
          title={collapsed ? "CFO Lens" : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {!collapsed && <span>CFO Lens</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
