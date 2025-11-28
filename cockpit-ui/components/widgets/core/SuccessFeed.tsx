"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  SuccessFeedConfig,
  SuccessFeedData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatRelativeTime, formatDateTime } from "@/lib/dashboard/formatters";

export interface SuccessFeedProps extends WidgetProps<SuccessFeedConfig, SuccessFeedData> {
  className?: string;
}

/**
 * Recent wins/success feed widget
 * Shows recent payments, conversions, or deals
 */
export function SuccessFeed({
  config,
  data,
  state,
  className = "",
}: SuccessFeedProps) {
  const items = data?.items || [];
  const maxItems = config.max_items || 5;
  const displayItems = items.slice(0, maxItems);

  // Get success type icon
  const getSuccessIcon = () => {
    switch (config.success_type) {
      case "payment":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "conversion":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "deal":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  // Get success type label
  const getSuccessLabel = () => {
    switch (config.success_type) {
      case "payment":
        return "Paid";
      case "conversion":
        return "Converted";
      case "deal":
        return "Won";
      default:
        return "Success";
    }
  };

  return (
    <WidgetCard title={config.title} className={className}>
      {displayItems.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No recent successes
        </div>
      ) : (
        <ul className="space-y-3">
          {displayItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-green-50 border-green-200"
            >
              {/* Success icon */}
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                {getSuccessIcon()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {item.entity_name}
                    </div>
                    {config.show_details && item.metric_label && (
                      <div className="text-xs text-gray-500">
                        {item.metric_label}: {item.metric_value}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">
                      {formatCurrency(item.value)}
                    </div>
                    {item.badge && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-1 text-xs text-gray-500">
                  {getSuccessLabel()} {formatRelativeTime(item.completed_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Show more indicator */}
      {items.length > maxItems && (
        <div className="mt-3 pt-3 border-t text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all {items.length} successes
          </button>
        </div>
      )}
    </WidgetCard>
  );
}
