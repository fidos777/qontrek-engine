"use client";

import { useEffect, useMemo, useState } from "react";

type RiskSeverity = "HIGH" | "MEDIUM" | "LOW";

type RiskItem = {
  id: string;
  customer: string;
  stage: string;
  severity: RiskSeverity;
  impact_rm: number;
  probability: number;
  owner: string;
  days_exposed: number;
  next_action: string;
};

type RiskSummaryResponse = {
  generated_at: string;
  stages: string[];
  risks: RiskItem[];
};

interface Filters {
  severity: RiskSeverity | "ALL";
  stage: string | "ALL";
}

const severityPalette: Record<RiskSeverity, string> = {
  HIGH: "bg-rose-500/15 text-rose-700 border border-rose-500/40",
  MEDIUM: "bg-amber-500/15 text-amber-700 border border-amber-500/40",
  LOW: "bg-blue-500/15 text-blue-700 border border-blue-500/40",
};

export default function RiskHeatmapPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RiskSummaryResponse | null>(null);
  const [filters, setFilters] = useState<Filters>({ severity: "ALL", stage: "ALL" });
  const [selected, setSelected] = useState<RiskItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/cfo/risk/summary", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as RiskSummaryResponse;
      setData(payload);
      setFeedback(null);
    } catch (err) {
      console.error("Risk summary load failed", err);
      setFeedback("Unable to load risk telemetry.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRisks = useMemo(() => {
    if (!data) return [];
    return data.risks.filter((risk) => {
      const severityOk = filters.severity === "ALL" || risk.severity === filters.severity;
      const stageOk = filters.stage === "ALL" || risk.stage === filters.stage;
      return severityOk && stageOk;
    });
  }, [data, filters]);

  const heatmapCounts = useMemo(() => {
    if (!data) return [];
    return data.stages.map((stage) => {
      const stageRisks = data.risks.filter((risk) => risk.stage === stage);
      return {
        stage,
        HIGH: stageRisks.filter((risk) => risk.severity === "HIGH").length,
        MEDIUM: stageRisks.filter((risk) => risk.severity === "MEDIUM").length,
        LOW: stageRisks.filter((risk) => risk.severity === "LOW").length,
      };
    });
  }, [data]);

  const triggerIntervention = async (risk: RiskItem, action: string) => {
    try {
      await fetch("/api/cfo/risk/intervene", {
        method: "POST",
        body: JSON.stringify({
          risk_id: risk.id,
          action,
          stage: risk.stage,
          severity: risk.severity,
        }),
      });
      setFeedback(`Intervention "${action}" recorded for ${risk.customer}.`);
    } catch (err) {
      console.error("Risk intervention failed", err);
      setFeedback("Unable to record intervention.");
    }
  };

  if (loading) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading risk matrix…
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Risk matrix unavailable.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CFO Lens · Risk Heatmap</h1>
          <p className="mt-1 text-sm text-slate-600">
            Payment exposure and intervention triggers. Updated {new Date(data.generated_at).toLocaleString()}.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Refresh
        </button>
      </header>

      {feedback ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {feedback}
        </div>
      ) : null}

      <section
        role="region"
        aria-label="Risk filters"
        className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="text-sm text-slate-600">
          Severity
          <select
            value={filters.severity}
            onChange={(event) =>
              setFilters((state) => ({ ...state, severity: event.target.value as Filters["severity"] }))
            }
            className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </label>

        <label className="text-sm text-slate-600">
          Stage
          <select
            value={filters.stage}
            onChange={(event) =>
              setFilters((state) => ({ ...state, stage: event.target.value as Filters["stage"] }))
            }
            className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <option value="ALL">All</option>
            {data.stages.map((stage) => (
              <option key={stage} value={stage}>
                {formatStage(stage)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section
        role="region"
        aria-label="Risk heatmap"
        className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">High</th>
              <th className="px-3 py-2">Medium</th>
              <th className="px-3 py-2">Low</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {heatmapCounts.map((row) => (
              <tr key={row.stage}>
                <td className="px-3 py-2 font-medium text-slate-700">{formatStage(row.stage)}</td>
                <td className="px-3 py-2">
                  <HeatCell count={row.HIGH} tone="HIGH" />
                </td>
                <td className="px-3 py-2">
                  <HeatCell count={row.MEDIUM} tone="MEDIUM" />
                </td>
                <td className="px-3 py-2">
                  <HeatCell count={row.LOW} tone="LOW" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        role="region"
        aria-live="polite"
        aria-label="Risk details"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {filteredRisks.length} exposure{filteredRisks.length === 1 ? "" : "s"} in view
          </h2>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Filtered by {filters.stage.toLowerCase()} / {filters.severity.toLowerCase()}
          </span>
        </div>

        {filteredRisks.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No risks match the current filters.
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredRisks.map((risk) => (
              <li
                key={risk.id}
                className={`rounded-lg px-4 py-4 shadow-sm transition ${severityPalette[risk.severity]}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide">{risk.id}</span>
                      <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-semibold text-slate-800">
                        {risk.severity}
                      </span>
                      <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs text-slate-600">
                        {formatStage(risk.stage)}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900">{risk.customer}</p>
                    <p className="text-sm text-slate-700">
                      Impact {formatCurrency(risk.impact_rm)} · Probability {(risk.probability * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-600">
                      Owner {risk.owner} · {risk.days_exposed} days exposed
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      aria-label={`View details for ${risk.customer}`}
                      onClick={() => setSelected(risk)}
                      className="rounded-md border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                    >
                      Drill down
                    </button>
                    <button
                      type="button"
                      aria-label={`Record intervention for ${risk.customer}`}
                      onClick={() => triggerIntervention(risk, "manual_intervention")}
                      className="rounded-md border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                    >
                      Record intervention
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <Dialog onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">{selected.customer}</h2>
              <p className="text-sm text-slate-600">
                {formatStage(selected.stage)} · {selected.severity} severity
              </p>
            </header>
            <dl className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <dt>Impact</dt>
                <dd className="font-semibold">{formatCurrency(selected.impact_rm)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Probability</dt>
                <dd className="font-semibold">{(selected.probability * 100).toFixed(1)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt>Owner</dt>
                <dd className="font-semibold">{selected.owner}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Days exposed</dt>
                <dd className="font-semibold">{selected.days_exposed}</dd>
              </div>
            </dl>
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {selected.next_action}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => triggerIntervention(selected, "escalate_cfo")}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Escalate to CFO
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </main>
  );
}

function formatStage(stage: string) {
  return stage.replace("pending_", "").replace("_", " ").toUpperCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

function HeatCell({ count, tone }: { count: number; tone: RiskSeverity }) {
  const color =
    tone === "HIGH"
      ? "bg-rose-500/20 text-rose-700"
      : tone === "MEDIUM"
      ? "bg-amber-500/20 text-amber-700"
      : "bg-blue-500/20 text-blue-700";
  return (
    <span className={`inline-flex min-w-[3rem] justify-center rounded-md px-2 py-1 text-xs font-semibold ${color}`}>
      {count}
    </span>
  );
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/40 transition hover:bg-slate-900/50"
      />
      <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}
