"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type MarginPoint = {
  month: string;
  margin: number;
  revenue: number;
  gross_profit: number;
};

type CostSlice = {
  category: string;
  value: number;
};

type UnitEconomics = {
  metric: string;
  value: number;
  unit: string;
};

type ProfitabilityResponse = {
  generated_at: string;
  margins: MarginPoint[];
  breakdown: {
    costs: CostSlice[];
    unit_economics: UnitEconomics[];
    runway: { months: number; burn_rate: number; cash_on_hand: number };
  };
};

const costPalette = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

export default function ProfitabilityPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/cfo/profitability", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as ProfitabilityResponse;
      setData(payload);
      setError(null);
    } catch (err) {
      console.error("Profitability fetch failed", err);
      setError("Unable to load profitability telemetry.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading profitability insights…
        </div>
      </main>
    );
  }

  if (!data || error) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error ?? "Profitability data missing."}
        </div>
      </main>
    );
  }

  const latestMargin = data.margins[data.margins.length - 1];
  const earliestMargin = data.margins[0];

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CFO Lens · Profitability</h1>
          <p className="mt-1 text-sm text-slate-600">
            Margin trajectory, cost stack, and cash runway snapshot. Updated {formatRelative(data.generated_at)}.
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

      <section
        role="region"
        aria-label="Gross margin trend"
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Gross margin trend</h2>
          <span className="text-xs uppercase tracking-wide text-slate-500">Quarter pivot</span>
        </div>
        <p className="sr-only" aria-live="polite">
          Gross margin improved from {earliestMargin.margin}% to {latestMargin.margin}% with revenue{" "}
          {formatCurrency(latestMargin.revenue)} in {latestMargin.month}.
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.margins}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ fontSize: "0.75rem" }}
                formatter={(value: number, name) => {
                  if (name === "margin") {
                    return [`${value}%`, "Margin"];
                  }
                  if (name === "revenue") {
                    return [formatCurrency(value), "Revenue"];
                  }
                  return [formatCurrency(value), "Gross profit"];
                }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section
        role="region"
        aria-live="polite"
        aria-label="Cost breakdown"
        className="grid gap-6 lg:grid-cols-[2fr_1fr]"
      >
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cost distribution</h2>
          <p className="text-sm text-slate-500">Ops P&L breakdown by category</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.breakdown.costs}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {data.breakdown.costs.map((slice, index) => (
                    <Cell key={slice.category} fill={costPalette[index % costPalette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name) => [formatCurrency(value), name]}
                  contentStyle={{ fontSize: "0.75rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {data.breakdown.costs.map((slice, index) => (
              <li key={slice.category} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: costPalette[index % costPalette.length] }}
                  />
                  {slice.category}
                </span>
                <span className="font-medium">{formatCurrency(slice.value)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Unit economics</h3>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              {data.breakdown.unit_economics.map((metric) => (
                <div key={metric.metric} className="flex justify-between">
                  <dt className="text-slate-500">{metric.metric}</dt>
                  <dd className="font-semibold">
                    {metric.unit === "%" ? `${metric.value}%` : `${formatNumber(metric.value)} ${metric.unit}`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Cash runway</h3>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <dt className="text-slate-500">Months runway</dt>
                <dd className="font-semibold">{data.breakdown.runway.months} months</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Monthly burn</dt>
                <dd className="font-semibold">{formatCurrency(data.breakdown.runway.burn_rate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Cash on hand</dt>
                <dd className="font-semibold">{formatCurrency(data.breakdown.runway.cash_on_hand)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatRelative(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
