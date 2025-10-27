// components/ui/ProofFreshnessQuick.tsx
// Displays proof freshness with pulsing indicator and relative timestamp

"use client";

import * as React from "react";

export interface ProofFreshnessQuickProps {
  verifiedAt?: string | Date;
  className?: string;
}

/**
 * ProofFreshnessQuick - Shows "Verified Xs ago" with pulsing green dot
 */
export default function ProofFreshnessQuick({
  verifiedAt,
  className = "",
}: ProofFreshnessQuickProps) {
  const [relativeTime, setRelativeTime] = React.useState<string>("");

  React.useEffect(() => {
    if (!verifiedAt) {
      setRelativeTime("Not verified");
      return;
    }

    const updateRelativeTime = () => {
      const timestamp = typeof verifiedAt === "string" ? new Date(verifiedAt) : verifiedAt;
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds < 60) {
        setRelativeTime(`Verified ${diffSeconds}s ago`);
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        setRelativeTime(`Verified ${minutes}m ago`);
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        setRelativeTime(`Verified ${hours}h ago`);
      } else {
        const days = Math.floor(diffSeconds / 86400);
        setRelativeTime(`Verified ${days}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [verifiedAt]);

  const isRecent = React.useMemo(() => {
    if (!verifiedAt) return false;
    const timestamp = typeof verifiedAt === "string" ? new Date(verifiedAt) : verifiedAt;
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    return diffMs < 300000; // Less than 5 minutes = recent
  }, [verifiedAt]);

  return (
    <div className={`inline-flex items-center gap-2 text-sm ${className}`}>
      {/* Pulsing green dot */}
      <span className="relative flex h-3 w-3">
        {isRecent && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>

      {/* Timestamp */}
      <span className="text-gray-700 font-medium">{relativeTime}</span>
    </div>
  );
}
