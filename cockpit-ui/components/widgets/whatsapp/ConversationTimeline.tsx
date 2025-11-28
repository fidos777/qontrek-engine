"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  WAConversationTimelineConfig,
  WAConversationTimelineData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatRelativeTime } from "@/lib/dashboard/formatters";

export interface ConversationTimelineProps extends WidgetProps<WAConversationTimelineConfig, WAConversationTimelineData> {
  className?: string;
}

/**
 * WhatsApp conversation timeline widget
 * Shows message history with direction and status indicators
 */
export function ConversationTimeline({
  config,
  data,
  state,
  className = "",
}: ConversationTimelineProps) {
  const messages = data?.messages || [];
  const sessionInfo = data?.session_info;
  const maxMessages = config.max_messages || 20;
  const displayMessages = messages.slice(-maxMessages);

  // Get message status icon
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "sent":
        return (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "delivered":
        return (
          <div className="flex -space-x-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "read":
        return (
          <div className="flex -space-x-1">
            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "failed":
        return (
          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get media type icon
  const getMediaIcon = (mediaType: string | undefined) => {
    switch (mediaType) {
      case "image":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "document":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "audio":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <WidgetCard
      title={config.title}
      subtitle={sessionInfo ? `${sessionInfo.contact_name} • ${sessionInfo.phone_number}` : undefined}
      noPadding
      className={className}
    >
      <div className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No messages yet
            </div>
          ) : (
            displayMessages.map((message) => {
              const isOutbound = message.direction === "outbound";

              return (
                <div
                  key={message.id}
                  className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-lg px-3 py-2
                      ${
                        isOutbound
                          ? "bg-green-100 text-gray-900 rounded-br-none"
                          : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                      }
                    `}
                  >
                    {/* Media indicator */}
                    {message.media_type && message.media_type !== "text" && (
                      <div className="flex items-center gap-1 mb-1 text-gray-500">
                        {getMediaIcon(message.media_type)}
                        <span className="text-xs capitalize">{message.media_type}</span>
                      </div>
                    )}

                    {/* Message content */}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Timestamp and status */}
                    <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : ""}`}>
                      {config.show_timestamps && (
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(message.timestamp)}
                        </span>
                      )}
                      {isOutbound && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load more indicator */}
        {messages.length > maxMessages && (
          <div className="px-4 py-2 text-center border-t bg-white">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Load {messages.length - maxMessages} more messages
            </button>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
