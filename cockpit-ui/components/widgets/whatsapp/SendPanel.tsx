"use client";

import * as React from "react";
import { WidgetCard } from "../WidgetCard";
import type {
  WASendPanelConfig,
  WASendPanelData,
  WidgetProps,
} from "@/lib/widgets/types";
import { formatRelativeTime } from "@/lib/dashboard/formatters";

export interface SendPanelProps extends WidgetProps<WASendPanelConfig, WASendPanelData> {
  className?: string;
}

/**
 * WhatsApp send panel widget
 * Allows sending messages to contacts using templates
 */
export function SendPanel({
  config,
  data,
  state,
  className = "",
}: SendPanelProps) {
  const [selectedContact, setSelectedContact] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [customMessage, setCustomMessage] = React.useState("");
  const [isCustom, setIsCustom] = React.useState(false);

  const recentContacts = data?.recent_contacts || [];
  const templates = data?.templates || [];

  // Get selected template details
  const activeTemplate = templates.find((t) => t.id === selectedTemplate);

  // Handle send
  const handleSend = () => {
    // In a real implementation, this would call an API
    console.log("Sending message:", {
      contact: selectedContact,
      template: isCustom ? null : selectedTemplate,
      customMessage: isCustom ? customMessage : null,
    });
  };

  const canSend = selectedContact && (isCustom ? customMessage.trim() : selectedTemplate);

  return (
    <WidgetCard title={config.title} className={className}>
      <div className="space-y-4">
        {/* Contact selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient
          </label>
          <select
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select a contact...</option>
            {recentContacts.map((contact) => (
              <option key={contact.phone} value={contact.phone}>
                {contact.name} ({contact.phone})
              </option>
            ))}
          </select>
          {selectedContact && (
            <div className="mt-1 text-xs text-gray-500">
              {recentContacts.find((c) => c.phone === selectedContact)?.last_contact && (
                <>
                  Last contact:{" "}
                  {formatRelativeTime(
                    recentContacts.find((c) => c.phone === selectedContact)!.last_contact!
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Message type toggle */}
        {config.allow_custom && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsCustom(false)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                !isCustom
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Use Template
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                isCustom
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Custom Message
            </button>
          </div>
        )}

        {/* Template selection */}
        {!isCustom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            {/* Template preview */}
            {activeTemplate && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Preview:</div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {activeTemplate.preview}
                </div>
                {activeTemplate.variables && activeTemplate.variables.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Variables: {activeTemplate.variables.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Custom message */}
        {isCustom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {customMessage.length} / 1024 characters
            </div>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors
            flex items-center justify-center gap-2
            ${
              canSend
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Send via WhatsApp
        </button>
      </div>
    </WidgetCard>
  );
}
