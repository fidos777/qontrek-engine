"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { logProofLoad } from "@/lib/telemetry";
import type { G0Response } from "@/types/gates";

async function fetchGate(url: string): Promise<G0Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture
    // NOTE: This branch is dead code in production builds.
    // Next.js will tree-shake this entire block when NODE_ENV=production
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/g0.summary.json");
      return mod.default as unknown as G0Response;
    }
    throw new Error("G0 summary endpoint unavailable");
  }
}

export default function Gate0Dashboard() {
  const [payload, setPayload] = useState<G0Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const telemetrySent = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g0/summary");
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

  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");
  const fmPct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");
  const fmTime = (v: unknown) => (typeof v === "number" ? `${v.toFixed(1)}h` : "-");

  // Split activity by status
  const hotLeads = data.activity.filter((a: any) => a.status === "hot");
  const warmLeads = data.activity.filter((a: any) => a.status === "warm");
  const coldLeads = data.activity.filter((a: any) => a.status === "cold");

  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Gate 0 — Lead Qualification</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Leads</div>
          <div className="text-2xl font-bold">{fmNum(summary.total_leads)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Conversion Rate</div>
          <div className="text-2xl font-bold">{fmPct(summary.conversion_rate)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Avg Response Time</div>
          <div className="text-2xl font-bold">{fmTime(summary.avg_response_time)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Qualified Rate</div>
          <div className="text-2xl font-bold">{fmPct(summary.qualified_rate)}</div>
        </Card>
      </div>

      {/* Lead Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Lead qualification panels">
        {/* Hot Leads Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Hot Leads</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              <span className="text-sm font-medium">{fmNum(summary.hot_leads)}</span>
            </div>
          </div>

          {hotLeads.length === 0 ? (
            <p className="text-sm text-gray-500">No hot leads at this time.</p>
          ) : (
            <ul aria-label="Hot leads list" className="space-y-3">
              {hotLeads.map((lead: any, idx: number) => (
                <li key={idx} className="border-l-4 border-red-500 pl-3 py-2">
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-500">{lead.contact}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      Score: {lead.score}
                    </span>
                    <span className="text-xs text-gray-500">{lead.source}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Warm Leads Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Warm Leads</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="text-sm font-medium">{fmNum(summary.warm_leads)}</span>
            </div>
          </div>

          {warmLeads.length === 0 ? (
            <p className="text-sm text-gray-500">No warm leads at this time.</p>
          ) : (
            <ul aria-label="Warm leads list" className="space-y-3">
              {warmLeads.map((lead: any, idx: number) => (
                <li key={idx} className="border-l-4 border-yellow-500 pl-3 py-2">
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-500">{lead.contact}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Score: {lead.score}
                    </span>
                    <span className="text-xs text-gray-500">{lead.source}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Cold Leads Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cold Leads</h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
              <span className="text-sm font-medium">{fmNum(summary.cold_leads)}</span>
            </div>
          </div>

          {coldLeads.length === 0 ? (
            <p className="text-sm text-gray-500">No cold leads at this time.</p>
          ) : (
            <ul aria-label="Cold leads list" className="space-y-3">
              {coldLeads.map((lead: any, idx: number) => (
                <li key={idx} className="border-l-4 border-blue-500 pl-3 py-2">
                  <div className="font-medium text-sm">{lead.company}</div>
                  <div className="text-xs text-gray-500">{lead.contact}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Score: {lead.score}
                    </span>
                    <span className="text-xs text-gray-500">{lead.source}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {data.activity.length === 0 ? (
          <p className="text-sm text-gray-500">No recent activity.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr>
                  <th scope="col" className="py-2 pr-4">Company</th>
                  <th scope="col" className="py-2 pr-4">Contact</th>
                  <th scope="col" className="py-2 pr-4">Status</th>
                  <th scope="col" className="py-2 pr-4">Score</th>
                  <th scope="col" className="py-2 pr-4">Source</th>
                  <th scope="col" className="py-2 pr-4">Response Time</th>
                  <th scope="col" className="py-2">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {data.activity.map((activity: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2 pr-4">{activity.company ?? "-"}</td>
                    <td className="py-2 pr-4">{activity.contact ?? "-"}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          activity.status === "hot"
                            ? "bg-red-100 text-red-800"
                            : activity.status === "warm"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {activity.status ?? "-"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{activity.score ?? "-"}</td>
                    <td className="py-2 pr-4">{activity.source ?? "-"}</td>
                    <td className="py-2 pr-4">{fmTime(activity.response_time)}</td>
                    <td className="py-2">
                      {activity.last_contact ? fmDT.format(new Date(activity.last_contact)) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
