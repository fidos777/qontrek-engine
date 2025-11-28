"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  GovernanceStripConfig,
  GovernanceStripData,
  WidgetProps,
} from "@/lib/widgets/types";

export interface GovernanceStripProps extends WidgetProps<GovernanceStripConfig, GovernanceStripData> {
  className?: string;
}

/**
 * Governance gates strip widget (G13-G21)
 * Shows gate status badges with pass/partial/pending/fail states
 */
export function GovernanceStrip({
  config,
  data,
  state,
  className = "",
}: GovernanceStripProps) {
  const gates = data?.gates || [];
  const summary = data?.summary;
  const isCompact = config.compact;

  // Get gate status color and icon
  const getGateStyle = (status: string) => {
    switch (status) {
      case "pass":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-300",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case "partial":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-300",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case "pending":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-300",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case "fail":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-300",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  // Find gate data
  const getGateData = (gateId: string) => {
    return gates.find((g) => g.id === gateId);
  };

  // Render compact view
  if (isCompact) {
    return (
      <WidgetCard className={className}>
        <div className="flex items-center justify-between">
          {/* Gate badges */}
          <div className="flex flex-wrap gap-2">
            {config.gates.map((gateId) => {
              const gate = getGateData(gateId);
              const style = getGateStyle(gate?.status || "pending");

              return (
                <div
                  key={gateId}
                  className={`flex items-center gap-1 px-2 py-1 rounded border ${style.bg} ${style.border}`}
                  title={gate?.name || gateId}
                >
                  <span className={style.text}>{style.icon}</span>
                  <span className={`text-xs font-medium ${style.text}`}>
                    {gateId}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {summary && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">{summary.passed}</span>
              <span className="text-gray-400"> / </span>
              <span>{summary.total}</span>
              <span className="text-gray-400 ml-1">passed</span>
            </div>
          )}
        </div>
      </WidgetCard>
    );
  }

  // Render full view
  return (
    <WidgetCard title={config.title} className={className}>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {config.gates.map((gateId) => {
          const gate = getGateData(gateId);
          const style = getGateStyle(gate?.status || "pending");

          return (
            <div
              key={gateId}
              className={`flex flex-col items-center p-3 rounded-lg border ${style.bg} ${style.border}`}
            >
              <span className={style.text}>{style.icon}</span>
              <span className={`text-sm font-medium ${style.text} mt-1`}>
                {gateId}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 truncate max-w-full">
                {gate?.name || "Unknown"}
              </span>
              {gate?.evidence_count !== undefined && (
                <span className="text-xs text-gray-400 mt-1">
                  {gate.evidence_count} evidence
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {summary && (
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600">Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-gray-600">Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-600">Fail</span>
            </div>
          </div>
          <div className="text-gray-600">
            <span className="font-semibold text-green-600">{summary.passed}</span>
            <span className="text-gray-400"> / </span>
            <span>{summary.total}</span>
            <span className="text-gray-400 ml-1">gates passed</span>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
