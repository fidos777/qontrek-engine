// components/voltek/VoltekKPICard.tsx
// KPI Card component for Voltek Dashboard

import { Card } from "@/components/ui/card";
import type { VoltekKPI } from "@/types/voltek";

interface VoltekKPICardProps {
  kpi: VoltekKPI;
}

export function VoltekKPICard({ kpi }: VoltekKPICardProps) {
  const formatValue = (value: number, format: VoltekKPI["format"]) => {
    switch (format) {
      case "currency":
        return `RM ${value.toLocaleString("en-MY")}`;
      case "percentage":
        return `${value}%`;
      default:
        return value.toLocaleString("en-MY");
    }
  };

  const getIcon = (icon: VoltekKPI["icon"]) => {
    switch (icon) {
      case "money":
        return (
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "clock":
        return (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "alert":
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "check":
        return (
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const colorClasses = {
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    yellow: "text-yellow-600 bg-yellow-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{kpi.label}</span>
        <span className={`p-1.5 rounded ${colorClasses[kpi.color]}`}>
          {getIcon(kpi.icon)}
        </span>
      </div>
      <div className="text-2xl font-bold">{formatValue(kpi.value, kpi.format)}</div>
    </Card>
  );
}
