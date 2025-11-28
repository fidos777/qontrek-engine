"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";
import { formatCurrency, formatDate } from "@/lib/dashboard/formatters";

interface SuccessItem {
  id: string;
  lead_name: string;
  deal_value: number;
  closed_at: string;
  sales_rep?: string;
  product?: string;
}

export function SuccessFeedRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error, schema } = instance;

  const successes = (data.successes as SuccessItem[]) ?? [];
  const title = (data.title as string) || schema.title || "Recent Wins";

  return (
    <WidgetCard title={title} loading={state === "loading"} error={error}>
      <div className="space-y-3">
        {successes.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No recent wins to display
          </p>
        ) : (
          successes.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.lead_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.product && <span>{item.product} · </span>}
                  {item.sales_rep && <span>Closed by {item.sales_rep}</span>}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(item.deal_value)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.closed_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}

export default SuccessFeedRenderer;
