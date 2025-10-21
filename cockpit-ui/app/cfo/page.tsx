"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { logProofLoad } from "@/lib/telemetry";
import type { CFOResponse } from "@/types/gates";

async function fetchCFO(url: string): Promise<CFOResponse> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture
    // NOTE: This branch is dead code in production builds.
    // Next.js will tree-shake this entire block when NODE_ENV=production
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/cfo.summary.json");
      return mod.default as unknown as CFOResponse;
    }
    throw new Error("CFO summary endpoint unavailable");
  }
}

export default function CFODashboard() {
  const [payload, setPayload] = useState<CFOResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const telemetrySent = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchCFO("/api/cfo/summary");
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
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmPct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");
  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");

  const currentTab = data.tabs[activeTab];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">CFO Lens</h1>

      {/* Summary KPIs */}
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold">{fmMYR.format(Number(data.summary.total_revenue || 0))}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Outstanding</div>
            <div className="text-2xl font-bold">{fmMYR.format(Number(data.summary.total_outstanding || 0))}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Collection Rate</div>
            <div className="text-2xl font-bold">{fmPct(data.summary.collection_rate)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Avg Margin</div>
            <div className="text-2xl font-bold">{fmPct(data.summary.avg_margin)}</div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="CFO dashboard tabs">
          {data.tabs.map((tab, idx) => (
            <button
              key={tab.id}
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
              {tab.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      {currentTab && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{currentTab.title}</h2>

          {Object.keys(currentTab.metrics).length === 0 ? (
            <p className="text-sm text-gray-500">No metrics available for this tab.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(currentTab.metrics).map(([key, value]) => (
                <div key={key} className="border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1 capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-lg font-semibold">
                    {typeof value === "number" ? (
                      value > 0 && value < 1 ? fmPct(value) :
                      key.includes("cash") || key.includes("revenue") || key.includes("value") || key.includes("burn") || key.includes("recoverable") || key.includes("recovered") || key.includes("forecast") || key.includes("risk") ? fmMYR.format(value) :
                      fmNum(value)
                    ) : (
                      value
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Placeholder for future chart */}
          <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-sm text-gray-500">Chart visualization placeholder</p>
            <p className="text-xs text-gray-400 mt-1">Future: Mini chart for {currentTab.title} metrics</p>
          </div>
        </Card>
      )}
    </div>
  );
}
