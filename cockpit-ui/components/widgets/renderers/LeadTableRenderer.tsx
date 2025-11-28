"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";
import { formatCurrency, formatDate } from "@/lib/dashboard/formatters";

interface Lead {
  id: string;
  name: string;
  company?: string;
  value: number;
  stage: string;
  stage_color?: string;
  last_activity: string;
  priority?: "high" | "medium" | "low";
}

export function LeadTableRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error, schema } = instance;

  const leads = (data.leads as Lead[]) ?? [];
  const title = (data.title as string) || schema.title || "Leads";

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
            High
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            Med
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <WidgetCard title={title} loading={state === "loading"} error={error}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                Lead
              </th>
              <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">
                Stage
              </th>
              <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">
                Value
              </th>
              <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No leads to display
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-2">
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lead.name}
                        </p>
                        {lead.company && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {lead.company}
                          </p>
                        )}
                      </div>
                      {getPriorityBadge(lead.priority)}
                    </div>
                  </td>
                  <td className="py-2">
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded"
                      style={{
                        backgroundColor: lead.stage_color
                          ? `${lead.stage_color}20`
                          : "#e5e7eb",
                        color: lead.stage_color || "#374151",
                      }}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(lead.value)}
                  </td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400">
                    {formatDate(lead.last_activity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </WidgetCard>
  );
}

export default LeadTableRenderer;
