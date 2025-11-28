"use client";

import * as React from "react";
import Link from "next/link";
import type { VerticalMeta } from "@/lib/verticals/types";

export interface VerticalSwitcherProps {
  verticals: VerticalMeta[];
  activeVertical?: string;
  className?: string;
}

/**
 * Dropdown switcher for changing between verticals
 */
export function VerticalSwitcher({
  verticals,
  activeVertical,
  className = "",
}: VerticalSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentVertical = verticals.find((v) => v.id === activeVertical);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        {currentVertical && (
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: currentVertical.color }}
          />
        )}
        <span className="text-sm font-medium text-gray-900">
          {currentVertical?.name || "Select Vertical"}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">
              Industry Verticals
            </div>
            {verticals.map((vertical) => {
              const isActive = vertical.id === activeVertical;

              return (
                <Link
                  key={vertical.id}
                  href={`/v/${vertical.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${vertical.color}20` }}
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: vertical.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{vertical.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {vertical.description}
                    </div>
                  </div>
                  {isActive && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
