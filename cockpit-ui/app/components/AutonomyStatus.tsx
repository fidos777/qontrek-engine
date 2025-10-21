import React from "react";
import type { TowerSummary } from "../autonomy/types";

interface AutonomyStatusProps {
  summary: TowerSummary;
}

export function AutonomyStatus({ summary }: AutonomyStatusProps) {
  const { kpis } = summary;
  const status =
    kpis.policy_diff_class === "material"
      ? "attention"
      : kpis.autotune_guard_active
      ? "healthy"
      : "warning";

  return (
    <section className="rounded-md border border-slate-200 p-4 shadow-sm">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-800">Autonomy Status</h2>
        <div className="flex items-center gap-2">
          <IntegrityChip
            ok={summary.cloud_parity_ok}
            checkedAt={summary.cloud_parity_checked_at}
          />
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {summary.generated_at}
          </span>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
        <div>
          <p className="font-medium text-slate-600">Governance posture</p>
          <p className="text-lg font-semibold capitalize text-slate-900">{status}</p>
        </div>
        <div>
          <p className="font-medium text-slate-600">Ack rate (24h)</p>
          <p className="text-lg font-semibold text-slate-900">
            {(kpis.ack_rate_24h * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-600">Latency p95</p>
          <p className="text-lg font-semibold text-slate-900">
            {(kpis.alert_action_latency_ms_p95 / 1000).toFixed(1)}s
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-600">DLQ replay success</p>
          <p className="text-lg font-semibold text-slate-900">
            {(kpis.replay_success_rate * 100).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="font-medium text-slate-600">DLQ depth</p>
          <p className="text-lg font-semibold text-slate-900">{kpis.dlq_depth}</p>
        </div>
        <div>
          <p className="font-medium text-slate-600">NTP offset</p>
          <p className="text-lg font-semibold text-slate-900">{kpis.ntp_offset_ms} ms</p>
        </div>
      </div>
    </section>
  );
}

export default AutonomyStatus;

interface IntegrityChipProps {
  ok?: boolean;
  checkedAt?: string;
}

function IntegrityChip({ ok, checkedAt }: IntegrityChipProps) {
  let colorClass = "bg-amber-100 text-amber-700 border border-amber-200";
  let label = "Integrity";
  let title = checkedAt ? `Last parity check ${checkedAt}` : "Parity status pending";

  if (ok === true) {
    colorClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
    label = "Integrity";
    title = checkedAt ? `Parity confirmed ${checkedAt}` : "Parity confirmed";
  } else if (ok === false) {
    colorClass = "bg-rose-100 text-rose-700 border border-rose-200";
    label = "Integrity";
    title = "Parity mismatch detected";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${colorClass}`}
      title={title}
    >
      {label}
    </span>
  );
}
