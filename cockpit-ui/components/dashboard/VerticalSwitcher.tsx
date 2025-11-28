"use client";

import * as React from "react";
import type { VerticalId } from "@/lib/verticals/types";
import { verticalRegistry } from "@/lib/verticals";

export interface VerticalSwitcherProps {
  currentVertical: VerticalId;
  onVerticalChange: (verticalId: VerticalId) => void;
}

export function VerticalSwitcher({
  currentVertical,
  onVerticalChange,
}: VerticalSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const verticals = Object.values(verticalRegistry);
  const current = verticalRegistry[currentVertical];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: current.color }}
        >
          {current.name.charAt(0)}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {current.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-20">
            <div className="p-2">
              {verticals.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    onVerticalChange(v.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    currentVertical === v.id
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: v.color }}
                  >
                    {v.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {v.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {v.name_ms}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VerticalSwitcher;
