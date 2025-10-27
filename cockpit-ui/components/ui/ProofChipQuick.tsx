// components/ui/ProofChipQuick.tsx
// Proof chip components for displaying cryptographic proof badges

"use client";

import * as React from "react";

export interface ProofChipQuickProps {
  hash?: string;
  verified?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * ProofChipQuick - Full-size proof badge with hash prefix
 * Default export
 */
export default function ProofChipQuick({
  hash = "",
  verified = true,
  onClick,
  className = "",
}: ProofChipQuickProps) {
  const displayHash = hash ? hash.slice(0, 8) : "pending";
  const bgColor = verified ? "bg-green-100" : "bg-gray-100";
  const textColor = verified ? "text-green-800" : "text-gray-600";
  const borderColor = verified ? "border-green-300" : "border-gray-300";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bgColor} ${textColor} ${borderColor} text-sm font-medium hover:opacity-80 transition-opacity ${className}`}
      title={hash || "No proof available"}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <span className="font-mono">{displayHash}</span>
    </button>
  );
}

/**
 * ProofChipCompact - Minimal proof badge without text
 * Named export
 */
export function ProofChipCompact({
  hash = "",
  verified = true,
  onClick,
  className = "",
}: ProofChipQuickProps) {
  const bgColor = verified ? "bg-green-100" : "bg-gray-100";
  const textColor = verified ? "text-green-700" : "text-gray-500";
  const borderColor = verified ? "border-green-300" : "border-gray-300";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${bgColor} ${textColor} ${borderColor} hover:opacity-80 transition-opacity ${className}`}
      title={hash ? `Proof: ${hash.slice(0, 16)}...` : "No proof available"}
      aria-label="View cryptographic proof"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    </button>
  );
}
