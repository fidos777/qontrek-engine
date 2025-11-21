"use client";

import { useEffect, useState } from "react";

interface GovernanceStatus {
  label: string;
  status: "ok" | "warning" | "error";
}

export default function GovernanceHeaderStrip() {
  const [checks, setChecks] = useState<GovernanceStatus[]>([]);

  useEffect(() => {
    // Simulated governance checks - in production, fetch from API
    const governanceChecks: GovernanceStatus[] = [
      { label: "Token Drift", status: "ok" },
      { label: "Motion Drift", status: "ok" },
      { label: "Type Safety", status: "ok" },
      { label: "A11y Compliance", status: "ok" },
    ];
    setChecks(governanceChecks);
  }, []);

  const getStatusColor = (status: GovernanceStatus["status"]) => {
    switch (status) {
      case "ok":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: GovernanceStatus["status"]) => {
    switch (status) {
      case "ok":
        return "\u2713";
      case "warning":
        return "!";
      case "error":
        return "\u2717";
      default:
        return "?";
    }
  };

  if (checks.length === 0) {
    return (
      <div className="h-10 w-full rounded-lg bg-[var(--bg-muted,#f3f4f6)] animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 rounded-lg text-sm">
      <span className="text-slate-400 font-medium">Governance</span>
      <div className="flex items-center gap-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-1.5"
            title={`${check.label}: ${check.status}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${getStatusColor(check.status)}`}
            >
              {getStatusIcon(check.status)}
            </span>
            <span className="text-slate-300">{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
