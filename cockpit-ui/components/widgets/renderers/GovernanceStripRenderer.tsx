"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";

interface GovernanceStatus {
  merkle_hash?: string;
  last_proof_at?: string;
  proof_count?: number;
  audit_enabled?: boolean;
  schema_version?: string;
}

export function GovernanceStripRenderer({ instance }: WidgetComponentProps) {
  const { data, state, error } = instance;

  const status: GovernanceStatus = {
    merkle_hash: data.merkle_hash as string | undefined,
    last_proof_at: data.last_proof_at as string | undefined,
    proof_count: data.proof_count as number | undefined,
    audit_enabled: data.audit_enabled as boolean | undefined,
    schema_version: data.schema_version as string | undefined,
  };

  const shortenHash = (hash?: string): string => {
    if (!hash) return "—";
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  return (
    <WidgetCard loading={state === "loading"} error={error}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${
                status.audit_enabled ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-gray-600 dark:text-gray-400">
              Audit {status.audit_enabled ? "On" : "Off"}
            </span>
          </div>
          {status.schema_version && (
            <span className="text-gray-500 dark:text-gray-500">
              v{status.schema_version}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {status.proof_count !== undefined && (
            <span className="text-gray-600 dark:text-gray-400">
              {status.proof_count} proofs
            </span>
          )}
          {status.merkle_hash && (
            <code className="font-mono text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {shortenHash(status.merkle_hash)}
            </code>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}

export default GovernanceStripRenderer;
