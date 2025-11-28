"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  ReminderListConfig,
  ReminderListData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatDateTime, formatRelativeTime } from "@/lib/dashboard/formatters";

export interface ReminderListProps extends WidgetProps<ReminderListConfig, ReminderListData> {
  className?: string;
}

/**
 * Active reminders list widget
 * Shows scheduled reminders with channel and status
 */
export function ReminderList({
  config,
  data,
  state,
  className = "",
}: ReminderListProps) {
  const reminders = data?.reminders || [];
  const maxItems = config.max_items || 10;
  const displayReminders = reminders.slice(0, maxItems);

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "whatsapp":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
      case "sms":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case "call":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  // Get channel color
  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email":
        return "text-blue-600 bg-blue-50";
      case "whatsapp":
        return "text-green-600 bg-green-50";
      case "sms":
        return "text-purple-600 bg-purple-50";
      case "call":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      queued: "bg-blue-100 text-blue-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          statusColors[status] || statusColors.queued
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <WidgetCard title={config.title} className={className}>
      {displayReminders.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No reminders scheduled
        </div>
      ) : (
        <ul className="space-y-3">
          {displayReminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              {/* Channel icon */}
              <div
                className={`p-2 rounded-full ${getChannelColor(reminder.channel)}`}
              >
                {getChannelIcon(reminder.channel)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {reminder.entity_name || reminder.recipient}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {reminder.recipient}
                    </div>
                  </div>
                  {getStatusBadge(reminder.status)}
                </div>

                {/* Scheduled time */}
                {config.show_scheduled_time && (
                  <div className="mt-1 text-xs text-gray-500">
                    Scheduled: {formatDateTime(reminder.scheduled_at)}
                  </div>
                )}

                {/* Message preview */}
                {reminder.message_preview && (
                  <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                    {reminder.message_preview}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Show more indicator */}
      {reminders.length > maxItems && (
        <div className="mt-3 pt-3 border-t text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all {reminders.length} reminders
          </button>
        </div>
      )}
    </WidgetCard>
  );
}
