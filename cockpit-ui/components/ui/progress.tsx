// components/ui/progress.tsx
// Progress bar component

import * as React from "react";

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  barClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className = "", barClassName = "" }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full bg-blue-600 transition-all duration-300 ease-in-out ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
