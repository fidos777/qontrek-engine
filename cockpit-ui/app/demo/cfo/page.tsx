"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ProofChip } from "@/components/voltek/ProofChip";
import { ProofModal } from "@/components/voltek/ProofModal";

// Mock snapshot data with proof hash
interface SnapshotData {
  hash: string;
  rel: string;
  source: "real" | "fallback";
  schemaVersion: string;
  summary: {
    total_revenue: number;
    total_outstanding: number;
    operating_cashflow: number;
    avg_collection_days: number;
    pipeline_value: number;
  };
  tabs: Array<{
    id: string;
    title: string;
    metrics: Record<string, number | string>;
  }>;
}

// Mock getSnapshot function
function getSnapshot(): SnapshotData {
  return {
    hash: "0x8f7a3b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
    rel: "cfo_demo_proof_v1.0.json",
    source: "real",
    schemaVersion: "1.0.0",
    summary: {
      total_revenue: 3250000,
      total_outstanding: 524000,
      operating_cashflow: 485000,
      avg_collection_days: 42,
      pipeline_value: 1850000,
    },
    tabs: [
      {
        id: "overview",
        title: "Overview",
        metrics: {
          total_revenue: 3250000,
          total_expenses: 1890000,
          net_profit: 1360000,
          profit_margin: 0.42,
          total_assets: 8500000,
          total_liabilities: 3200000,
          equity: 5300000,
          current_ratio: 2.1,
        },
      },
      {
        id: "cashflow",
        title: "Cashflow",
        metrics: {
          operating_cashflow: 485000,
          investing_cashflow: -125000,
          financing_cashflow: 75000,
          net_cashflow: 435000,
          cash_on_hand: 1250000,
          burn_rate: 15000,
          runway_months: 24,
        },
      },
      {
        id: "ageing",
        title: "Ageing",
        metrics: {
          current_0_30d: 185000,
          overdue_31_60d: 142000,
          overdue_61_90d: 98000,
          overdue_90d_plus: 99000,
          total_outstanding: 524000,
          avg_collection_days: 42,
          at_risk_amount: 197000,
        },
      },
      {
        id: "pipeline",
        title: "Pipeline",
        metrics: {
          pipeline_value: 1850000,
          qualified_leads: 47,
          active_deals: 28,
          avg_deal_size: 66071,
          conversion_rate: 0.34,
          expected_close_30d: 425000,
          win_rate: 0.58,
        },
      },
      {
        id: "roi",
        title: "ROI",
        metrics: {
          total_investment: 2500000,
          current_valuation: 8500000,
          roi_multiple: 3.4,
          roi_percentage: 2.4,
          payback_period_months: 18,
          irr: 0.45,
          customer_ltv: 185000,
          customer_cac: 12500,
          ltv_cac_ratio: 14.8,
        },
      },
    ],
  };
}

export default function DemoCFOPage() {
  const snapshot = getSnapshot();
  const [activeTab, setActiveTab] = useState(0);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const fmMYR = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });
  const fmPct = (v: unknown) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "-");
  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");

  const currentTab = snapshot.tabs[activeTab];

  return (
    <div className="p-6 space-y-6">
      {/* Header with Proof Chip */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CFO Lens - Demo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Interactive dashboard with cryptographic proof verification
          </p>
        </div>
        <ProofChip hash={snapshot.hash} onClick={() => setIsProofModalOpen(true)} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold">{fmMYR.format(snapshot.summary.total_revenue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-2xl font-bold">{fmMYR.format(snapshot.summary.total_outstanding)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Operating CF</div>
          <div className="text-2xl font-bold">{fmMYR.format(snapshot.summary.operating_cashflow)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Avg Collection</div>
          <div className="text-2xl font-bold">{snapshot.summary.avg_collection_days} days</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Pipeline Value</div>
          <div className="text-2xl font-bold">{fmMYR.format(snapshot.summary.pipeline_value)}</div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="CFO demo tabs">
          {snapshot.tabs.map((tab, idx) => (
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{currentTab.title}</h2>
            <span className="text-xs text-gray-400 font-mono">
              Tab ID: {currentTab.id}
            </span>
          </div>

          {Object.keys(currentTab.metrics).length === 0 ? (
            <p className="text-sm text-gray-500">No metrics available for this tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Metric
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(currentTab.metrics).map(([key, value], idx) => (
                    <tr
                      key={key}
                      className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right font-mono">
                        {typeof value === "number" ? (
                          value > 0 && value < 1 ? (
                            fmPct(value)
                          ) : key.includes("cash") ||
                            key.includes("revenue") ||
                            key.includes("value") ||
                            key.includes("burn") ||
                            key.includes("investment") ||
                            key.includes("valuation") ||
                            key.includes("profit") ||
                            key.includes("expense") ||
                            key.includes("asset") ||
                            key.includes("liability") ||
                            key.includes("equity") ||
                            key.includes("outstanding") ||
                            key.includes("overdue") ||
                            key.includes("current") ||
                            key.includes("ltv") ||
                            key.includes("cac") ||
                            key.includes("close") ||
                            key.includes("size") ? (
                            fmMYR.format(value)
                          ) : (
                            fmNum(value)
                          )
                        ) : (
                          value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary totals for the tab */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded p-3 border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Metrics Count</div>
                    <div className="text-lg font-bold text-blue-900">
                      {Object.keys(currentTab.metrics).length}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded p-3 border border-green-100">
                    <div className="text-xs text-green-600 font-medium">Data Source</div>
                    <div className="text-lg font-bold text-green-900 capitalize">
                      {snapshot.source}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded p-3 border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium">Schema Version</div>
                    <div className="text-lg font-bold text-purple-900">
                      {snapshot.schemaVersion}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Proof Modal */}
      <ProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        snapshot={{
          hash: snapshot.hash,
          summary: snapshot.summary,
          rel: snapshot.rel,
          source: snapshot.source,
          schemaVersion: snapshot.schemaVersion,
        }}
      />
    </div>
  );
}
