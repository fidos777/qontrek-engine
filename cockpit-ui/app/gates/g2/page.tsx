"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { logProofLoad } from "@/lib/telemetry";
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

  if (error) return (
    <div className="p-6">
      <p style={{ color: 'var(--danger)' }} aria-live="polite">Error: {error}</p>
    </div>
  );

  if (!payload) return (
    <div className="p-6" style={{ color: 'var(--text-2)' }}>Loading...</div>
  );

  const { data } = payload;
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const pct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>
        Gate 2 — Payment Recovery
      </h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm" style={{ color: 'var(--text-3)' }}>Total Recoverable</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            {fmMYR.format(Number(data.summary.total_recoverable || 0))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm" style={{ color: 'var(--text-3)' }}>7-Day Recovery Rate</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            {pct(kpi["recovery_rate_7d"])}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            Avg days to pay: {kpi["average_days_to_payment"] ?? "-"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: 'var(--text-3)' }}>Pending Cases</div>
              <div className="text-xl font-semibold" style={{ color: 'var(--text-1)' }}>
                {kpi["pending_cases"] ?? 0}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--text-3)' }}>Handover Queue</div>
              <div className="text-xl font-semibold" style={{ color: 'var(--warn)' }}>
                {kpi["handover_queue"] ?? 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Leads */}
        <Card className="p-4">
          <div className="text-lg font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
            Critical Leads
          </div>
          {data.critical_leads.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No critical overdue leads.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: 'var(--text-2)' }}>
                <thead className="text-left" style={{ borderBottom: '1px solid var(--stroke-sub)' }}>
                  <tr>
                    <th scope="col" className="py-2 pr-4" style={{ color: 'var(--text-3)' }}>Name</th>
                    <th scope="col" className="py-2 pr-4" style={{ color: 'var(--text-3)' }}>Stage</th>
                    <th scope="col" className="py-2 pr-4" style={{ color: 'var(--text-3)' }}>Amount</th>
                    <th scope="col" className="py-2 pr-4" style={{ color: 'var(--text-3)' }}>Overdue</th>
                    <th scope="col" className="py-2" style={{ color: 'var(--text-3)' }}>Last Reminder</th>
                  </tr>
                </thead>
                <tbody>
                  {data.critical_leads.map((r: any, idx: number) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--stroke-sub)' }}>
                      <td className="py-2 pr-4">{r.name ?? "-"}</td>
                      <td className="py-2 pr-4">{r.stage ?? "-"}</td>
                      <td className="py-2 pr-4">{typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}</td>
                      <td className="py-2 pr-4" style={{ color: 'var(--danger)' }}>
                        {typeof r.overdue_days === "number" ? `${r.overdue_days}d` : "-"}
                      </td>
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
            <div className="text-lg font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
              Active Reminders
            </div>
            {data.active_reminders.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No active reminders scheduled.</p>
            ) : (
              <ul aria-label="Active reminders" className="space-y-2">
                {data.active_reminders.map((r: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded px-3 py-2"
                    style={{
                      border: '1px solid var(--stroke-sub)',
                      background: 'var(--bg-panel)'
                    }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-1)' }}>
                        {r.recipient ?? "-"}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {r.channel ?? "-"} · {r.scheduled_at ? fmDT.format(new Date(r.scheduled_at)) : "-"}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: 'var(--chip-80)',
                        color: 'var(--accent)'
                      }}
                    >
                      {r.status ?? "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <div className="text-lg font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
              Recent Success
            </div>
            {data.recent_success.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No recent payments.</p>
            ) : (
              <ul aria-label="Recent payments" className="space-y-2">
                {data.recent_success.map((r: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded px-3 py-2"
                    style={{
                      border: '1px solid var(--stroke-sub)',
                      background: 'var(--bg-panel)'
                    }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-1)' }}>
                        {r.name ?? "-"}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>
                        Paid {r.paid_at ? fmDT.format(new Date(r.paid_at)) : "-"} · {typeof r.days_to_pay === "number" ? `${r.days_to_pay} days` : "-"}
                      </div>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                      {typeof r.amount === "number" ? fmMYR.format(r.amount) : "-"}
                    </div>
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
