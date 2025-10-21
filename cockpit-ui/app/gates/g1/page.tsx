"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { logProofLoad } from "@/lib/telemetry";
import type { G1Response } from "@/types/gates";

async function fetchGate(url: string): Promise<G1Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture
    // NOTE: This branch is dead code in production builds.
    // Next.js will tree-shake this entire block when NODE_ENV=production
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/g1.summary.json");
      return mod.default as unknown as G1Response;
    }
    throw new Error("G1 summary endpoint unavailable");
  }
}

export default function Gate1Dashboard() {
  const [payload, setPayload] = useState<G1Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const telemetrySent = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g1/summary");
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
  const summary = data.summary;
  const rawData = data as any; // Type assertion for additional properties not in frozen contract

  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");
  const fmPct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");
  const fmTime = (v: unknown) => (typeof v === "number" ? `${v.toFixed(1)}s` : "-");
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" });
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });

  // Safe number extraction for calculations
  const toNum = (v: unknown): number => (typeof v === "number" ? v : 0);

  const tabs = [
    "Decisions Summary",
    "Variance Matrix",
    "Trigger Audit",
    "Review History",
    "Forecast Drift"
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Gate 1 — Decision Engine</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Decisions</div>
          <div className="text-2xl font-bold">{fmNum(summary.total_decisions)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Approval Rate</div>
          <div className="text-2xl font-bold">{fmPct(summary.approval_rate)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Avg Decision Time</div>
          <div className="text-2xl font-bold">{fmTime(summary.avg_decision_time)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Drift Index</div>
          <div className="text-2xl font-bold">{fmPct(summary.drift_index)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Manual Override</div>
          <div className="text-2xl font-bold">{fmPct(summary.manual_override_ratio)}</div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Decision engine tabs">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  idx === activeTab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
              aria-current={idx === activeTab ? "page" : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Decisions Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded p-4">
              <div className="text-sm text-gray-500 mb-1">Approved</div>
              <div className="text-2xl font-semibold text-green-600">{fmNum(summary.approved)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {toNum(summary.total_decisions) ? Math.round((toNum(summary.approved) / toNum(summary.total_decisions)) * 100) : 0}% of total
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-500 mb-1">Rejected</div>
              <div className="text-2xl font-semibold text-red-600">{fmNum(summary.rejected)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {toNum(summary.total_decisions) ? Math.round((toNum(summary.rejected) / toNum(summary.total_decisions)) * 100) : 0}% of total
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-500 mb-1">Pending</div>
              <div className="text-2xl font-semibold text-yellow-600">{fmNum(summary.pending)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {toNum(summary.total_decisions) ? Math.round((toNum(summary.pending) / toNum(summary.total_decisions)) * 100) : 0}% of total
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Variance Matrix</h2>
          {rawData.variance_matrix && rawData.variance_matrix.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Segment</th>
                    <th scope="col" className="py-2 pr-4">Predicted Approval</th>
                    <th scope="col" className="py-2 pr-4">Actual Approval</th>
                    <th scope="col" className="py-2">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.variance_matrix.map((row: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4 font-medium">{row.segment}</td>
                      <td className="py-2 pr-4">{fmPct(row.predicted_approval)}</td>
                      <td className="py-2 pr-4">{fmPct(row.actual_approval)}</td>
                      <td className={`py-2 ${row.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.variance >= 0 ? '+' : ''}{fmPct(Math.abs(row.variance))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No variance data available.</p>
          )}
        </Card>
      )}

      {activeTab === 2 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Trigger Audit</h2>
          {rawData.trigger_audit && rawData.trigger_audit.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Trigger Name</th>
                    <th scope="col" className="py-2 pr-4">Fire Count</th>
                    <th scope="col" className="py-2 pr-4">Approval Rate</th>
                    <th scope="col" className="py-2">Avg Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.trigger_audit.map((trigger: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4 font-medium">{trigger.trigger_name.replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-4">{fmNum(trigger.fire_count)}</td>
                      <td className="py-2 pr-4">{fmPct(trigger.approval_rate)}</td>
                      <td className="py-2">{fmPct(trigger.avg_confidence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No trigger audit data available.</p>
          )}
        </Card>
      )}

      {activeTab === 3 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Review History</h2>
          {data.top_items && data.top_items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr>
                    <th scope="col" className="py-2 pr-4">ID</th>
                    <th scope="col" className="py-2 pr-4">Entity</th>
                    <th scope="col" className="py-2 pr-4">Decision</th>
                    <th scope="col" className="py-2 pr-4">Amount</th>
                    <th scope="col" className="py-2 pr-4">Confidence</th>
                    <th scope="col" className="py-2 pr-4">Decided By</th>
                    <th scope="col" className="py-2 pr-4">Time (s)</th>
                    <th scope="col" className="py-2">Decided At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4 font-mono text-xs">{item.id}</td>
                      <td className="py-2 pr-4">{item.entity}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            item.decision === "approved"
                              ? "bg-green-100 text-green-800"
                              : item.decision === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.decision}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{fmMYR.format(item.amount)}</td>
                      <td className="py-2 pr-4">{fmPct(item.confidence)}</td>
                      <td className="py-2 pr-4">{item.decided_by ?? "Pending"}</td>
                      <td className="py-2 pr-4">{item.decision_time ? fmTime(item.decision_time) : "-"}</td>
                      <td className="py-2">
                        {item.decided_at ? fmDT.format(new Date(item.decided_at)) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No decision history available.</p>
          )}
        </Card>
      )}

      {activeTab === 4 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Forecast Drift</h2>
          {rawData.forecast_drift && rawData.forecast_drift.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mb-6">
                  <thead className="text-left">
                    <tr>
                      <th scope="col" className="py-2 pr-4">Period</th>
                      <th scope="col" className="py-2 pr-4">Predicted Accuracy</th>
                      <th scope="col" className="py-2">Actual Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.forecast_drift.map((row: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 pr-4 font-medium">{row.period}</td>
                        <td className="py-2 pr-4">{fmPct(row.predicted_accuracy)}</td>
                        <td className="py-2">{fmPct(row.actual_accuracy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Chart Placeholder */}
              <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-sm text-gray-500">Chart visualization placeholder</p>
                <p className="text-xs text-gray-400 mt-1">Future: Line chart showing forecast accuracy drift over time</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No forecast drift data available.</p>
          )}
        </Card>
      )}
    </div>
  );
}
