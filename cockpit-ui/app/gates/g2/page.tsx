"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { logProofLoad } from "@/lib/telemetry";
import ProofChip from "@/components/ProofChip";
import type { G2Response } from "@/types/gates";

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gate 2 — Payment Recovery</h1>
        {payload?.rel && payload?.source && <ProofChip rel={payload.rel} source={payload.source} />}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Recoverable</div>
          <div className="text-2xl font-bold">{fmMYR.format(Number(data.summary.total_recoverable || 0))}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
          <div className="text-2xl font-bold">{pct(kpi["recovery_rate_7d"])}</div>
          <div className="text-xs text-gray-500 mt-2">Avg days to pay: {kpi["average_days_to_payment"] ?? "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Cases</div>
              <div className="text-xl font-semibold">{kpi["pending_cases"] ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Handover Queue</div>
              <div className="text-xl font-semibold">{kpi["handover_queue"] ?? 0}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Leads */}
        <Card className="p-4">
          <div className="text-lg font-semibold mb-3">Critical Leads</div>
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
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{r.name ?? "-"}</td>
                      <td className="py-2 pr-4">{r.stage ?? "-"}</td>
                      <td className="py-2 pr-4">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</td>
                      <td className="py-2 pr-4">{typeof r.overdue_days === "number" ? `${r.overdue_days}d` : "-"}</td>
                      <td className="py-2">{r.last_reminder_at ? fmDT.format(new Date(r.last_reminder_at)) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right column stack */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="p-4">
            <div className="text-lg font-semibold mb-3">Active Reminders</div>
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

          <Card className="p-4">
            <div className="text-lg font-semibold mb-3">Recent Success</div>
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
    </div>
  );
}
