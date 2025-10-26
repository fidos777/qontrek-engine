/**
 * ProofChip - A small pill component displaying a cryptographic hash
 * Session 1A - Data model & store
 *
 * Displays a shortened hash (first 8 characters by default) and emits
 * an "open-proof-modal" event when clicked for proof verification.
 */

"use client";

import React from "react";

// ============================================================================
// Types
// ============================================================================

export interface ProofChipProps {
  /**
   * Full hash string to display (will be truncated)
   */
  hash: string;

  /**
   * Number of characters to display from the hash
   * @default 8
   */
  displayLength?: number;

  /**
   * Optional CSS class name for styling
   */
  className?: string;

  /**
   * Optional title/tooltip text
   */
  title?: string;

  /**
   * Variant style
   * @default "default"
   */
  variant?: "default" | "success" | "warning" | "info";

  /**
   * Size variant
   * @default "sm"
   */
  size?: "xs" | "sm" | "md";

  /**
   * Optional click handler (in addition to the event)
   */
  onClick?: (hash: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProofChip component for displaying dataset proof hashes
 */
export function ProofChip({
  hash,
  displayLength = 8,
  className = "",
  title,
  variant = "default",
  size = "sm",
  onClick,
}: ProofChipProps) {
  const shortHash = hash.slice(0, displayLength);

  const handleClick = () => {
    // Emit custom event for modal opening
    if (typeof window !== "undefined") {
      const event = new CustomEvent("open-proof-modal", {
        detail: { hash },
      });
      window.dispatchEvent(event);
    }

    // Call optional onClick handler
    if (onClick) {
      onClick(hash);
    }
  };

  // Variant-based styling
  const variantClasses = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
    success: "bg-green-100 text-green-700 hover:bg-green-200 border-green-300",
    warning: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300",
    info: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300",
  };

  // Size-based styling
  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-sm",
    md: "px-3 py-1.5 text-base",
  };

  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-full border font-mono font-medium transition-colors cursor-pointer select-none";

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      onClick={handleClick}
      className={combinedClasses}
      title={title || `Proof hash: ${hash}`}
      type="button"
      aria-label="View proof details"
    >
      <svg
        className="w-3 h-3 opacity-60"
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
      <span>{shortHash}</span>
    </button>
  );
}

// ============================================================================
// Utility Components
// ============================================================================

/**
 * ProofChipGroup - Display multiple proof chips
 */
export interface ProofChipGroupProps {
  hashes: string[];
  displayLength?: number;
  className?: string;
  variant?: "default" | "success" | "warning" | "info";
  size?: "xs" | "sm" | "md";
}

export function ProofChipGroup({
  hashes,
  displayLength = 8,
  className = "",
  variant = "default",
  size = "sm",
}: ProofChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {hashes.map((hash, index) => (
        <ProofChip
          key={`${hash}-${index}`}
          hash={hash}
          displayLength={displayLength}
          variant={variant}
          size={size}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ProofChip;
