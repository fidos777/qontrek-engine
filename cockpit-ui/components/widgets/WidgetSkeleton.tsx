"use client";

import * as React from "react";

export interface WidgetSkeletonProps {
  variant?: "card" | "table" | "chart" | "kpi";
  className?: string;
}

export function WidgetSkeleton({
  variant = "card",
  className = "",
}: WidgetSkeletonProps) {
  const baseClasses =
    "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  if (variant === "kpi") {
    return (
      <div className={`p-4 ${className}`}>
        <div className={`${baseClasses} h-4 w-24 mb-2`} />
        <div className={`${baseClasses} h-8 w-32 mb-1`} />
        <div className={`${baseClasses} h-3 w-20`} />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={`p-4 space-y-3 ${className}`}>
        <div className="flex space-x-4">
          <div className={`${baseClasses} h-4 w-1/4`} />
          <div className={`${baseClasses} h-4 w-1/4`} />
          <div className={`${baseClasses} h-4 w-1/4`} />
          <div className={`${baseClasses} h-4 w-1/4`} />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex space-x-4">
            <div className={`${baseClasses} h-6 w-1/4`} />
            <div className={`${baseClasses} h-6 w-1/4`} />
            <div className={`${baseClasses} h-6 w-1/4`} />
            <div className={`${baseClasses} h-6 w-1/4`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={`p-4 ${className}`}>
        <div className={`${baseClasses} h-4 w-32 mb-4`} />
        <div className="flex items-end space-x-2 h-32">
          {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
            <div
              key={i}
              className={`${baseClasses} w-full`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div className={`p-4 space-y-3 ${className}`}>
      <div className={`${baseClasses} h-4 w-3/4`} />
      <div className={`${baseClasses} h-4 w-1/2`} />
      <div className={`${baseClasses} h-20 w-full`} />
    </div>
  );
}

export default WidgetSkeleton;
