"use client";

import * as React from "react";
import { WidgetCard } from "./WidgetCard";

export type SkeletonVariant =
  | "kpi"
  | "chart"
  | "table"
  | "list"
  | "meter"
  | "funnel"
  | "heatmap"
  | "default";

export interface WidgetSkeletonProps {
  variant?: SkeletonVariant;
  title?: string;
  rows?: number;
  className?: string;
}

/**
 * Loading skeleton for widgets
 */
export function WidgetSkeleton({
  variant = "default",
  title,
  rows = 3,
  className = "",
}: WidgetSkeletonProps) {
  const renderContent = () => {
    switch (variant) {
      case "kpi":
        return <KPISkeleton />;
      case "chart":
        return <ChartSkeleton />;
      case "table":
        return <TableSkeleton rows={rows} />;
      case "list":
        return <ListSkeleton rows={rows} />;
      case "meter":
        return <MeterSkeleton />;
      case "funnel":
        return <FunnelSkeleton />;
      case "heatmap":
        return <HeatmapSkeleton />;
      default:
        return <DefaultSkeleton />;
    }
  };

  return (
    <WidgetCard title={title} loading className={className}>
      {renderContent()}
    </WidgetCard>
  );
}

function SkeletonPulse({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={style}
    />
  );
}

function KPISkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonPulse className="h-4 w-24" />
      <SkeletonPulse className="h-8 w-32" />
      <SkeletonPulse className="h-3 w-20" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between h-32 gap-2">
        {[40, 60, 45, 75, 55, 80, 65].map((height, i) => (
          <SkeletonPulse
            key={i}
            className="flex-1"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((_, i) => (
          <SkeletonPulse key={i} className="h-3 w-6" />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        <SkeletonPulse className="h-4 flex-[2]" />
        <SkeletonPulse className="h-4 flex-1" />
        <SkeletonPulse className="h-4 flex-1" />
        <SkeletonPulse className="h-4 w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <SkeletonPulse className="h-4 flex-[2]" />
          <SkeletonPulse className="h-4 flex-1" />
          <SkeletonPulse className="h-4 flex-1" />
          <SkeletonPulse className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 border rounded">
          <SkeletonPulse className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
          <SkeletonPulse className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

function MeterSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-4">
      <SkeletonPulse className="h-24 w-24 rounded-full" />
      <SkeletonPulse className="h-6 w-16" />
      <SkeletonPulse className="h-4 w-24" />
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="space-y-2">
      {[100, 85, 65, 45, 30].map((width, i) => (
        <SkeletonPulse
          key={i}
          className="h-10 mx-auto"
          style={{ width: `${width}%` }}
        />
      ))}
    </div>
  );
}

function HeatmapSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="flex gap-1">
          {Array.from({ length: 7 }).map((_, col) => (
            <SkeletonPulse key={col} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPulse className="h-4 w-3/4" />
      <SkeletonPulse className="h-4 w-1/2" />
      <SkeletonPulse className="h-20 w-full" />
      <SkeletonPulse className="h-4 w-2/3" />
    </div>
  );
}
