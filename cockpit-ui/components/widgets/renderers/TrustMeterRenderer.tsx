"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";

export function TrustMeterRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error } = instance;

  const trustScore = (data.trust_score as number) ?? 0;
  const lastVerified = data.last_verified as string | undefined;
  const proofCount = (data.proof_count as number) ?? 0;

  const clampedScore = Math.max(0, Math.min(100, trustScore));

  const getColorClass = (): string => {
    if (clampedScore >= 80) return "bg-green-500";
    if (clampedScore >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getLabel = (): string => {
    if (clampedScore >= 80) return "High Confidence";
    if (clampedScore >= 50) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <WidgetCard title="Trust Meter" loading={state === "loading"} error={error}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getLabel()}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {clampedScore}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColorClass()} transition-all duration-500 ease-out`}
            style={{ width: `${clampedScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{proofCount} proofs verified</span>
          {lastVerified && (
            <span>Last: {new Date(lastVerified).toLocaleDateString("ms-MY")}</span>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

export default TrustMeterRenderer;
