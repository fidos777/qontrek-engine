"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { CFOResponse } from "@/types/gates";

// Static demo data for production builds
const DEMO_DATA: CFOResponse = {
  ok: true,
  rel: "cfo_fulltabs_demo.json",
  source: "fallback",
  schemaVersion: "1.0.0",
  data: {
    summary: {
      total_revenue: 2850000,
      total_outstanding: 485000,
      collection_rate: 0.87,
      avg_margin: 0.42,
    },
    tabs: [
      {
        id: "cashflow",
        title: "Cashflow",
        metrics: {
          cash_in_30d: 425000,
          cash_out_30d: 198000,
          net_cashflow: 227000,
          runway_months: 18,
          burn_rate: 12500,
        },
      },
      {
        id: "recovery",
        title: "Recovery",
        metrics: {
          total_recoverable: 152500,
          recovered_mtd: 89000,
          recovery_rate: 0.58,
          avg_days_to_pay: 11,
          active_cases: 14,
        },
      },
      {
        id: "margin",
        title: "Margin",
        metrics: {
          gross_margin: 0.42,
          net_margin: 0.28,
          avg_deal_margin: 0.35,
          margin_trend: 0.03,
          top_margin_segment: "Enterprise",
        },
      },
      {
        id: "forecast",
        title: "Forecast",
        metrics: {
          q_forecast: 875000,
          q_actual: 425000,
          forecast_accuracy: 0.89,
          revenue_at_risk: 45000,
          pipeline_value: 1250000,
        },
      },
      {
        id: "variance",
        title: "Variance",
        metrics: {
          revenue_variance: 0.05,
          cost_variance: -0.08,
          margin_variance: 0.12,
          headcount_variance: 2,
          budget_utilization: 0.78,
        },
      },
    ],
  },
};

export default function CFODashboard() {
  const [payload] = useState<CFOResponse>(DEMO_DATA);
  const [activeTab, setActiveTab] = useState(0);

  const { data } = payload;
  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmPct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");
  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");

  const currentTab = data.tabs[activeTab];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">CFO Lens</h1>
        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
          DEMO MODE
        </span>
      </div>

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
