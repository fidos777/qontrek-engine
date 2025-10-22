"use client";
// app/components/ProofChipV2.tsx
// ProofChip v2 - Inline proof badge with modal deep-link

import React, { useState } from "react";
import LineageTimelineTab from "./LineageTimelineTab";

interface ProofChipV2Props {
  refName: string;
  path?: string;
  status?: "verified" | "review" | "error";
  className?: string;
}

export default function ProofChipV2({
  refName,
  path,
  status = "verified",
  className = "",
}: ProofChipV2Props) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "lineage">("details");

  const statusConfig = {
    verified: {
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: "✓",
      label: "Verified",
    },
    review: {
      color: "bg-amber-100 text-amber-800 border-amber-300",
      icon: "⚠",
      label: "Review",
    },
    error: {
      color: "bg-rose-100 text-rose-800 border-rose-300",
      icon: "✗",
      label: "Error",
    },
  };

  const config = statusConfig[status];

  const handleClick = () => {
    setShowModal(true);
    // Emit telemetry
    if (typeof window !== "undefined") {
      fetch("/api/mcp/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "ui.proof_chip.open",
          refName,
          timestamp: Date.now(),
        }),
      }).catch(() => {
        // Silent fail for telemetry
      });
    }
  };

  const handleCopyLink = () => {
    const deepLink = `${window.location.origin}${window.location.pathname}#proof:${refName}`;
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 ${config.color} ${className}`}
        aria-label={`View proof ${refName}`}
        tabIndex={0}
      >
        <span aria-hidden="true">{config.icon}</span>
        <span className="font-mono">{refName}</span>
      </button>

      {/* Proof Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-modal-title"
          >
            <div className="sticky top-0 bg-white border-b">
              <div className="px-6 py-4 flex justify-between items-center">
                <h2 id="proof-modal-title" className="text-xl font-semibold">
                  Proof Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="px-6">
                <nav className="flex gap-4" aria-label="Proof tabs">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "details"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    aria-current={activeTab === "details" ? "page" : undefined}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("lineage")}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "lineage"
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    aria-current={activeTab === "lineage" ? "page" : undefined}
                  >
                    Lineage Timeline
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div className="p-6 space-y-4">
              {/* Proof Reference */}
              <div>
                <div className="text-sm text-gray-500 mb-1">Proof Reference</div>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                    {refName}
                  </code>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${config.color}`}>
                    {config.icon} {config.label}
                  </span>
                </div>
              </div>

              {/* Path */}
              {path && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Source Path</div>
                  <code className="text-sm bg-gray-100 px-3 py-1 rounded block">
                    {path}
                  </code>
                </div>
              )}

              {/* Deep Link */}
              <div>
                <div className="text-sm text-gray-500 mb-1">Deep Link</div>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded break-all">
                    {typeof window !== "undefined" &&
                      `${window.location.origin}${window.location.pathname}#proof:${refName}`}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Copy deep link"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <div className="text-sm text-gray-500 mb-2">Metadata</div>
                <div className="bg-gray-50 rounded p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timestamp:</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">Proof Artifact</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex gap-2">
                <button
                  onClick={() => window.open(`/api/mcp/resources?ref=${refName}`, "_blank")}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  View in Registry
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
              </div>
            )}

            {/* Lineage Tab */}
            {activeTab === "lineage" && <LineageTimelineTab refName={refName} />}
          </div>
        </div>
      )}
    </>
  );
}
