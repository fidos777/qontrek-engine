// components/ui/ProofModalQuick.tsx
// Modal for displaying cryptographic proof JSON with copy functionality

"use client";

import * as React from "react";

export interface ProofModalQuickProps {
  isOpen: boolean;
  onClose: () => void;
  proof: any;
  title?: string;
}

/**
 * ProofModalQuick - Displays proof JSON in a modal with hash copying and ESC to close
 */
export default function ProofModalQuick({
  isOpen,
  onClose,
  proof,
  title = "Cryptographic Proof",
}: ProofModalQuickProps) {
  const [copied, setCopied] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Copy hash to clipboard
  const copyHash = async () => {
    try {
      const hash = proof?.hash || proof?.proof_hash || JSON.stringify(proof);
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isOpen) return null;

  const proofJson = JSON.stringify(proof, null, 2);
  const proofHash = proof?.hash || proof?.proof_hash || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="proof-modal-title" className="text-xl font-semibold">
            {title}
          </h2>
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

        {/* Hash display with copy button */}
        {proofHash && (
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex-1 overflow-hidden">
                <div className="text-xs text-gray-500 mb-1">Proof Hash</div>
                <code className="text-sm font-mono text-gray-800 break-all">
                  {proofHash}
                </code>
              </div>
              <button
                onClick={copyHash}
                className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* JSON display */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
            <pre className="text-sm text-green-400 font-mono">
              {proofJson}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-white border rounded text-xs font-mono">ESC</kbd> to close
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
