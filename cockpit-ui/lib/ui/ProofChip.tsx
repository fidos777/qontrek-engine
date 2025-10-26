// lib/ui/ProofChip.tsx
// Simple chip component for displaying proof/verification status

import * as React from "react";

export interface ProofChipProps {
  status: "valid" | "invalid" | "pending" | "unknown";
  label?: string;
  className?: string;
}

export const ProofChip: React.FC<ProofChipProps> = ({ status, label, className = "" }) => {
  const statusStyles = {
    valid: "bg-green-100 text-green-800 border-green-300",
    invalid: "bg-red-100 text-red-800 border-red-300",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    unknown: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const statusLabels = {
    valid: "Valid",
    invalid: "Invalid",
    pending: "Pending",
    unknown: "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[status]} ${className}`}
    >
      {label || statusLabels[status]}
    </span>
  );
};

export default ProofChip;
