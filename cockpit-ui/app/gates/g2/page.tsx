"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
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
  const [loading, setLoading] = useState(true);
  const telemetrySent = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await fetchGate("/api/gates/g2/summary");
        setPayload(resp);
        // Prevent double telemetry in Next.js StrictMode (dev only)
        if (!telemetrySent.current && resp?.rel && resp?.source) {
          logProofLoad(resp.rel, resp.source);
          telemetrySent.current = true;
        }
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Memoize expensive calculations
  const avgDaysToPayment = useMemo(() => {
    if (!payload?.data?.critical_leads || payload.data.critical_leads.length === 0) return 0;
    const total = payload.data.critical_leads.reduce((acc: number, lead: any) => {
      return acc + (typeof lead.overdue_days === 'number' ? lead.overdue_days : 0);
    }, 0);
    return Math.round(total / payload.data.critical_leads.length);
  }, [payload?.data?.critical_leads]);

  // Error state with graceful error card
  if (error) {
    return (
      <div className="p-6">
        <div role="status" aria-live="polite" className="sr-only">
          Error loading dashboard: {error}
        </div>
        <Card className="border-red-300 bg-red-50">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Unable to load dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Reload dashboard"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state with skeleton loaders
  if (loading || !payload) {
    return (
      <div className="p-6 space-y-6" style={{ minHeight: '100dvh' }}>
        <div role="status" aria-live="polite" className="sr-only">
          Loading dashboard data
        </div>
        <Skeleton className="h-8 w-64" />

        {/* KPI Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-white">
            <Skeleton className="h-6 w-32 mb-4" />
            <TableSkeleton rows={3} />
          </div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-white">
              <Skeleton className="h-6 w-32 mb-4" />
              <TableSkeleton rows={2} />
            </div>
            <div className="p-4 border rounded-lg bg-white">
              <Skeleton className="h-6 w-32 mb-4" />
              <TableSkeleton rows={2} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data } = payload;
  const kpi = (data.summary.kpi ?? {}) as Record<string, number | string>;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const pct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");

  return (
    <div className="p-6 space-y-6" style={{ minHeight: '100dvh' }}>
      <div role="status" aria-live="polite" className="sr-only">
        Dashboard loaded successfully
      </div>
      <h1 className="text-2xl font-semibold" tabIndex={0}>Gate 2 — Payment Recovery</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Key performance indicators">
        <Card className="p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2" tabIndex={0}>
          <div className="text-sm text-gray-500">Total Recoverable</div>
          <div className="text-2xl font-bold" aria-label={`Total recoverable amount: ${fmMYR.format(Number(data.summary.total_recoverable || 0))}`}>
            {fmMYR.format(Number(data.summary.total_recoverable || 0))}
          </div>
        </Card>
        <Card className="p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2" tabIndex={0}>
          <div className="text-sm text-gray-500">7-Day Recovery Rate</div>
          <div className="text-2xl font-bold" aria-label={`Seven day recovery rate: ${pct(kpi["recovery_rate_7d"])}`}>
            {pct(kpi["recovery_rate_7d"])}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Avg days to pay: {avgDaysToPayment > 0 ? avgDaysToPayment : (kpi["average_days_to_payment"] ?? "-")}
          </div>
        </Card>
        <Card className="p-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2" tabIndex={0}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Cases</div>
              <div className="text-xl font-semibold" aria-label={`Pending cases: ${kpi["pending_cases"] ?? 0}`}>
                {kpi["pending_cases"] ?? 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Handover Queue</div>
              <div className="text-xl font-semibold" aria-label={`Handover queue: ${kpi["handover_queue"] ?? 0}`}>
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
          <h2 className="text-lg font-semibold mb-3">Critical Leads</h2>
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
            <h2 className="text-lg font-semibold mb-3">Active Reminders</h2>
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
            <h2 className="text-lg font-semibold mb-3">Recent Success</h2>
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
