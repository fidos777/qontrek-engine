"use client";

import { useEffect, useRef } from "react";

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: {
    hash: string;
    summary: Record<string, any>;
    rel?: string;
    source?: string;
    schemaVersion?: string;
  };
}

export function ProofModal({ isOpen, onClose, snapshot }: ProofModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(snapshot.hash);
    // Simple feedback - could be enhanced with toast notification
    alert("Hash copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Proof Details</h2>
            <p className="text-sm text-gray-500 mt-1">Cryptographic snapshot verification</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Hash Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Hash</label>
              <button
                onClick={handleCopyHash}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                Copy Full Hash
              </button>
            </div>
            <div className="bg-gray-50 rounded p-3 font-mono text-xs break-all text-gray-800 border border-gray-200">
              {snapshot.hash}
            </div>
          </div>

          {/* Metadata Section */}
          {(snapshot.rel || snapshot.source || snapshot.schemaVersion) && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Metadata</label>
              <div className="bg-gray-50 rounded p-3 space-y-2 border border-gray-200">
                {snapshot.rel && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Rel:</span>
                    <span className="text-gray-800 font-mono">{snapshot.rel}</span>
                  </div>
                )}
                {snapshot.source && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Source:</span>
                    <span className="text-gray-800 font-mono">{snapshot.source}</span>
                  </div>
                )}
                {snapshot.schemaVersion && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Schema Version:</span>
                    <span className="text-gray-800 font-mono">{snapshot.schemaVersion}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary JSON Section */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Summary</label>
            <pre className="bg-gray-900 text-green-400 rounded p-4 text-xs overflow-x-auto border border-gray-700">
              {JSON.stringify(snapshot.summary, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
