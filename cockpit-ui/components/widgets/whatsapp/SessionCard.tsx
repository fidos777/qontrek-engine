"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  WASessionCardConfig,
  WASessionCardData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatRelativeTime, formatDateTime } from "@/lib/dashboard/formatters";

export interface SessionCardProps extends WidgetProps<WASessionCardConfig, WASessionCardData> {
  className?: string;
}

/**
 * WhatsApp session card widget
 * Shows session status, activity, and cost
 */
export function SessionCard({
  config,
  data,
  state,
  className = "",
}: SessionCardProps) {
  // Get status badge
  const getStatusBadge = (status: string | undefined) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      expired: "bg-red-100 text-red-800 border-red-200",
    };

    const statusLabels: Record<string, string> = {
      active: "Active",
      inactive: "Inactive",
      expired: "Expired",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded border text-xs font-medium ${
          statusColors[status || "inactive"] || statusColors.inactive
        }`}
      >
        {statusLabels[status || "inactive"] || "Unknown"}
      </span>
    );
  };

  return (
    <WidgetCard title={config.title} className={className}>
      <div className="space-y-4">
        {/* Header with status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {data?.phone_number || "No session"}
              </div>
              <div className="text-xs text-gray-500">
                Session: {data?.session_id?.slice(0, 8) || "N/A"}
              </div>
            </div>
          </div>
          {config.show_status && getStatusBadge(data?.status)}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">Messages</div>
            <div className="text-lg font-semibold text-gray-900">
              {data?.message_count || 0}
            </div>
          </div>
          {config.show_cost && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Cost</div>
              <div className="text-lg font-semibold text-gray-900">
                {data?.cost !== undefined ? formatCurrency(data.cost) : "-"}
              </div>
            </div>
          )}
        </div>

        {/* Activity timestamps */}
        <div className="space-y-2 text-sm">
          {data?.started_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Started</span>
              <span className="text-gray-900">{formatDateTime(data.started_at)}</span>
            </div>
          )}
          {data?.last_activity && (
            <div className="flex justify-between">
              <span className="text-gray-500">Last Activity</span>
              <span className="text-gray-900">{formatRelativeTime(data.last_activity)}</span>
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
