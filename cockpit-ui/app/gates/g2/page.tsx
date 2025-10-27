"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { logProofLoad } from "@/lib/telemetry";
import type { G2Response } from "@/types/gates";
import ProofChipQuick, { ProofChipCompact } from "@/components/ui/ProofChipQuick";
import ProofFreshnessQuick from "@/components/ui/ProofFreshnessQuick";
import ProofModalQuick from "@/components/ui/ProofModalQuick";
import { handleDataLoad } from "@/lib/utils/success-feedback-utils";
import { toast, Toaster } from "react-hot-toast";

async function fetchGate(url: string): Promise<G2Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture
    // NOTE: This branch is dead code in production builds.
    // Next.js will tree-shake this entire block when NODE_ENV=production
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/g2.summary.json");
      return mod.default as G2Response;
    }
    throw new Error("G2 summary endpoint unavailable");
  }
}

export default function Gate2Dashboard() {
  const [payload, setPayload] = useState<G2Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const telemetrySent = useRef(false);
  const [proofModal, setProofModal] = useState<{
    open: boolean;
    data: { field: string; value: any } | null;
  }>({
    open: false,
    data: null,
  });
  const [lastProofUpdate, setLastProofUpdate] = useState(new Date());

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g2/summary");
        setPayload(resp);
        // Prevent double telemetry in Next.js StrictMode (dev only)
        if (!telemetrySent.current && resp?.rel && resp?.source) {
          logProofLoad(resp.rel, resp.source);
          telemetrySent.current = true;
        }
        // Trigger success feedback and update freshness
        if (resp?.data) {
          handleDataLoad(resp.data.summary);
          setLastProofUpdate(new Date());
        }
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      }
    })();
  }, []);

  if (error) return <div className="p-6"><p className="text-red-600" aria-live="polite">Error: {error}</p></div>;
  if (!payload) return <div className="p-6">Loading...</div>;

  const { data } = payload;
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const pct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");

  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-1)] p-6">
      <Toaster position="top-right" />

      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">G2 Dashboard</h1>
            <p className="text-[var(--text-2)] text-sm mt-1">Payment Recovery & Pipeline Management</p>
          </div>

          <div className="flex items-center gap-6">
            <ProofFreshnessQuick lastUpdated={lastProofUpdate} />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-[var(--text-3)]">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-[var(--stroke)] bg-[var(--bg-card)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.02)] transition-all duration-200 hover:shadow-[0_8px_30px_-18px_rgba(91,140,255,0.35)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-[var(--text-3)]">Total Recoverable</p>
            <ProofChipCompact
              onClick={() => setProofModal({
                open: true,
                data: {
                  field: "total_recoverable",
                  value: fmMYR.format(Number(data.summary.total_recoverable || 0)),
                },
              })}
            />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-[var(--text-1)]">
            {fmMYR.format(Number(data.summary.total_recoverable || 0))}
          </p>
        </Card>
        <Card className="rounded-xl border border-[var(--stroke)] bg-[var(--bg-card)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.02)] transition-all duration-200 hover:shadow-[0_8px_30px_-18px_rgba(91,140,255,0.35)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-[var(--text-3)]">7-Day Recovery Rate</p>
            <ProofChipCompact
              onClick={() => setProofModal({
                open: true,
                data: {
                  field: "recovery_rate_7d",
                  value: pct(kpi["recovery_rate_7d"]),
                },
              })}
            />
          </div>
          <p className="text-4xl font-semibold tracking-tight text-[var(--text-1)]">
            {pct(kpi["recovery_rate_7d"])}
          </p>
          <p className="text-xs text-[var(--text-3)] mt-3">Avg days to pay: {kpi["average_days_to_payment"] ?? "-"}</p>
        </Card>
        <Card className="rounded-xl border border-[var(--stroke)] bg-[var(--bg-card)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.02)] transition-all duration-200 hover:shadow-[0_8px_30px_-18px_rgba(91,140,255,0.35)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-[var(--text-3)]">Pending Cases</p>
            <ProofChipCompact
              onClick={() => setProofModal({
                open: true,
                data: {
                  field: "pending_cases",
                  value: kpi["pending_cases"] ?? 0,
                },
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[var(--text-1)]">{kpi["pending_cases"] ?? 0}</p>
              <p className="text-xs text-[var(--text-3)] mt-1">Active cases</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-[var(--text-2)]">{kpi["handover_queue"] ?? 0}</p>
              <p className="text-xs text-[var(--text-3)] mt-1">In handover</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Critical Leads */}
        <Card className="rounded-xl border border-[var(--stroke)] bg-[var(--bg-card)] p-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-1)]">Critical Leads</h2>
          {data.critical_leads.length === 0 ? (
            <p className="text-sm text-gray-500">No critical overdue leads.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Name</th>
                    <th scope="col" className="py-2 pr-4">Stage</th>
                    <th scope="col" className="py-2 pr-4">Amount</th>
                    <th scope="col" className="py-2 pr-4">Overdue</th>
                    <th scope="col" className="py-2">Last Reminder</th>
                  </tr>
                </thead>
                <tbody>
                  {data.critical_leads.map((r: any, idx: number) => (
                    <tr key={idx} className="border-b border-[var(--stroke-sub)] hover:bg-[var(--bg-panel)] transition-colors">
                      <td className="py-3 text-[var(--text-1)]">{r.name ?? "-"}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded-md text-xs bg-[var(--chip-80)] border border-blue-400/20 text-blue-400">
                          {r.stage ?? "-"}
                        </span>
                      </td>
                      <td className="py-3 text-[var(--text-1)]">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</td>
                      <td className="py-3 text-[var(--text-2)]">{typeof r.overdue_days === "number" ? `${r.overdue_days}d` : "-"}</td>
                      <td className="py-3 text-[var(--text-3)] text-sm">{r.last_reminder_at ? fmDT.format(new Date(r.last_reminder_at)) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right column stack */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="rounded-xl border border-[var(--stroke)] bg-[var(--bg-card)] p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-1)]">Active Reminders</h2>
            {data.active_reminders.length === 0 ? (
              <p className="text-sm text-gray-500">No active reminders scheduled.</p>
            ) : (
              <ul aria-label="Active reminders" className="space-y-2">
                {data.active_reminders.map((r: any, i: number) => (
                  <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                    <div>
                      <div className="font-medium">{r.recipient ?? "-"}</div>
                      <div className="text-xs text-gray-500">{r.channel ?? "-"} · {r.scheduled_at ? fmDT.format(new Date(r.scheduled_at)) : "-"}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">{r.status ?? "-"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="rounded-xl border border-[var(--stroke)] bg-[var(--bg-card)] p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-1)]">Recent Success</h2>
            {data.recent_success.length === 0 ? (
              <p className="text-sm text-gray-500">No recent payments.</p>
            ) : (
              <ul aria-label="Recent payments" className="space-y-2">
                {data.recent_success.map((r: any, i: number) => (
                  <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                    <div>
                      <div className="font-medium">{r.name ?? "-"}</div>
                      <div className="text-xs text-gray-500">Paid {r.paid_at ? fmDT.format(new Date(r.paid_at)) : "-"} · {typeof r.days_to_pay === "number" ? `${r.days_to_pay} days` : "-"}</div>
                    </div>
                    <div className="text-sm font-semibold">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Proof Modal */}
      {proofModal.data && (
        <ProofModalQuick
          isOpen={proofModal.open}
          onClose={() => setProofModal({ open: false, data: null })}
          data={proofModal.data}
        />
      )}
    </main>
  );
}
