"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";
import { formatCurrency, formatNumber } from "@/lib/dashboard/formatters";

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  value: number;
  color?: string;
}

export function PipelineFunnelRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error, schema } = instance;

  const stages = (data.stages as FunnelStage[]) ?? [];
  const totalValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <WidgetCard
      title={schema.title || "Pipeline Funnel"}
      loading={state === "loading"}
      error={error}
    >
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const bgColor = stage.color || `hsl(${index * 40}, 70%, 50%)`;

          return (
            <div key={stage.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {stage.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatNumber(stage.count)} leads · {formatCurrency(stage.value)}
                </span>
              </div>
              <div className="w-full h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: bgColor,
                    minWidth: "2rem",
                  }}
                >
                  <span className="text-xs font-medium text-white">
                    {Math.round(widthPercent)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {stages.length > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-700 dark:text-gray-300">Total Pipeline</span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export default PipelineFunnelRenderer;
