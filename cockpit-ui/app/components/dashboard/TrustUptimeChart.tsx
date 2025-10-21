"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrustHistoryPoint = {
  time: string;
  trust: number;
};

type TrustSummary = {
  trust_index: number;
  uptime_7d: number;
  history: TrustHistoryPoint[];
  generated_at: string;
};

export default function TrustUptimeChart() {
  const [data, setData] = useState<TrustSummary>({
    trust_index: 100,
    uptime_7d: 99.9,
    history: [],
    generated_at: "",
  });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/trust/summary", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as TrustSummary;
      setData(payload);
    } catch (error) {
      console.error("Trust summary fetch failed", error);
    }
  };

  return (
    <section
      role="region"
      aria-label="System trust summary"
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">System trust</h2>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            7-day uptime {data.uptime_7d.toFixed(2)}% · Updated{" "}
            {data.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "—"}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700">
          {data.trust_index.toFixed(1)}%
        </span>
      </header>
      <p className="sr-only" aria-live="polite">
        Current trust index {data.trust_index.toFixed(1)} percent with seven day uptime {data.uptime_7d.toFixed(2)} percent.
      </p>

      <div className="mt-4 h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.history}>
            <XAxis dataKey="time" hide />
            <YAxis domain={[95, 100]} hide />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}%`, "Trust"]}
              labelFormatter={(label) => label}
              contentStyle={{ fontSize: "0.75rem" }}
            />
            <Line
              type="monotone"
              dataKey="trust"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
