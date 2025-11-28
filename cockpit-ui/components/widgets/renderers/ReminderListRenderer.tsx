"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";
import { formatDate } from "@/lib/dashboard/formatters";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  lead_name?: string;
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

export function ReminderListRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error, schema } = instance;

  const reminders = (data.reminders as Reminder[]) ?? [];
  const title = (data.title as string) || schema.title || "Reminders";

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="w-2 h-2 rounded-full bg-red-500" title="High priority" />
        );
      case "medium":
        return (
          <span className="w-2 h-2 rounded-full bg-amber-500" title="Medium priority" />
        );
      default:
        return (
          <span className="w-2 h-2 rounded-full bg-gray-400" title="Low priority" />
        );
    }
  };

  const isOverdue = (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  };

  return (
    <WidgetCard title={title} loading={state === "loading"} error={error}>
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No reminders scheduled
          </p>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`flex items-start space-x-3 p-2 rounded-lg border ${
                reminder.completed
                  ? "border-gray-200 dark:border-gray-700 opacity-60"
                  : isOverdue(reminder.due_date)
                  ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex-shrink-0 mt-1.5">
                {getPriorityIcon(reminder.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    reminder.completed
                      ? "line-through text-gray-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {reminder.title}
                </p>
                {reminder.lead_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reminder.lead_name}
                  </p>
                )}
                {reminder.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {reminder.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p
                  className={`text-xs font-medium ${
                    isOverdue(reminder.due_date) && !reminder.completed
                      ? "text-red-600"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {formatDate(reminder.due_date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}

export default ReminderListRenderer;
