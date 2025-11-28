"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  LeadTableConfig,
  LeadTableData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/dashboard/formatters";

export interface LeadTableProps extends WidgetProps<LeadTableConfig, LeadTableData> {
  className?: string;
}

/**
 * Data table widget for leads/entities
 * Supports sorting, filtering, and row actions
 */
export function LeadTable({
  config,
  data,
  state,
  className = "",
}: LeadTableProps) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const columns = config.columns || [];
  const rows = data?.rows || [];
  const maxRows = config.max_rows || 10;

  // Handle sorting
  const handleSort = (key: string) => {
    if (!columns.find((c) => c.key === key)?.sortable) return;

    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Sort rows
  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortKey, sortDirection]);

  // Limit rows
  const displayRows = sortedRows.slice(0, maxRows);

  // Format cell value based on column format
  const formatCell = (value: unknown, format?: string): string => {
    if (value === null || value === undefined) return "-";

    switch (format) {
      case "currency":
        return typeof value === "number" ? formatCurrency(value) : String(value);
      case "date":
        return typeof value === "string" ? formatDateTime(value) : String(value);
      case "percentage":
        return typeof value === "number"
          ? `${Math.round(value * 100)}%`
          : String(value);
      case "score":
        return String(value);
      case "status":
        return String(value);
      default:
        return String(value);
    }
  };

  // Get status badge color
  const getStatusColor = (value: unknown): string => {
    const status = String(value).toLowerCase();

    const statusColors: Record<string, string> = {
      hot: "bg-red-100 text-red-800",
      warm: "bg-yellow-100 text-yellow-800",
      cold: "bg-blue-100 text-blue-800",
      overdue: "bg-red-100 text-red-800",
      critical: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
      queued: "bg-blue-100 text-blue-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // Render cell
  const renderCell = (row: Record<string, unknown>, column: (typeof columns)[0]) => {
    const value = row[column.key];
    const formatted = formatCell(value, column.format);

    if (column.format === "status") {
      return (
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
            value
          )}`}
        >
          {formatted}
        </span>
      );
    }

    if (column.format === "score") {
      const score = typeof value === "number" ? value : 0;
      const scoreColor =
        score >= 80
          ? "text-green-600"
          : score >= 50
          ? "text-yellow-600"
          : "text-red-600";
      return <span className={`font-medium ${scoreColor}`}>{score}</span>;
    }

    return formatted;
  };

  return (
    <WidgetCard title={config.title} noPadding className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-3 px-4 font-medium text-gray-700 ${
                    col.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <svg
                        className={`w-4 h-4 ${
                          sortDirection === "desc" ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              {config.row_actions && config.row_actions.length > 0 && (
                <th scope="col" className="py-3 px-4 w-20" />
              )}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (config.row_actions?.length ? 1 : 0)}
                  className="py-8 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              displayRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      {renderCell(row, col)}
                    </td>
                  ))}
                  {config.row_actions && config.row_actions.length > 0 && (
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {config.row_actions.includes("view") && (
                          <button
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        {config.row_actions.includes("contact") && (
                          <button
                            className="p-1 text-gray-500 hover:text-green-600"
                            title="Contact"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination info */}
      {data?.total && data.total > maxRows && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t">
          Showing {displayRows.length} of {data.total} items
        </div>
      )}
    </WidgetCard>
  );
}
