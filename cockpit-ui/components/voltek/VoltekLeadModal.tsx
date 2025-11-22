// components/voltek/VoltekLeadModal.tsx
// Modal component for displaying lead details

"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { VoltekLead } from "@/types/voltek";

interface VoltekLeadModalProps {
  lead: VoltekLead | null;
  open: boolean;
  onClose: () => void;
}

export function VoltekLeadModal({ lead, open, onClose }: VoltekLeadModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open || !lead) return null;

  const formatCurrency = (value: number) =>
    `RM ${value.toLocaleString("en-MY")}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <Card
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-lg shadow-xl"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="modal-title" className="text-xl font-semibold">
                {lead.name}
              </h2>
              <p className="text-sm text-gray-500 font-mono">{lead.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Priority Badge */}
          <div className="mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                lead.priority === "HIGH"
                  ? "bg-red-100 text-red-800"
                  : lead.priority === "MEDIUM"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {lead.priority} Priority
            </span>
            <span
              className={`inline-block ml-2 px-3 py-1 rounded-full text-sm ${
                lead.stage === "80% Pending"
                  ? "bg-blue-100 text-blue-800"
                  : lead.stage === "20% Pending"
                  ? "bg-green-100 text-green-800"
                  : lead.stage === "NEM Stuck"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {lead.stage}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Phone
              </div>
              <div className="font-medium">{lead.phone}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                System Size
              </div>
              <div className="font-medium">{lead.system_size} kW</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Project Value
              </div>
              <div className="font-medium">
                {formatCurrency(lead.project_value)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Outstanding
              </div>
              <div className="font-medium text-red-600">
                {formatCurrency(lead.outstanding_amount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Days Overdue
              </div>
              <div
                className={`font-medium ${
                  lead.days_overdue > 20
                    ? "text-red-600"
                    : lead.days_overdue > 10
                    ? "text-yellow-600"
                    : "text-gray-900"
                }`}
              >
                {lead.days_overdue} days
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Last Contact
              </div>
              <div className="font-medium">{formatDate(lead.last_contact)}</div>
            </div>
          </div>

          {/* Next Action */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Next Action
            </div>
            <div className="text-sm">{lead.next_action}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                window.location.href = `tel:${lead.phone}`;
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Call Now
            </button>
            <button
              onClick={() => {
                window.location.href = `https://wa.me/60${lead.phone.replace(
                  /^0/,
                  ""
                ).replace(/-/g, "")}`;
              }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              WhatsApp
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
