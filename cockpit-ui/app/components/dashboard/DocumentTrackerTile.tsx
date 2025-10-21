"use client";

import { useEffect, useState } from "react";

type DocumentStats = {
  complete: number;
  missing: number;
  sla_breaches: number;
  generated_at: string;
};

const tone = {
  complete: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  missing: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  sla: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};

export default function DocumentTrackerTile() {
  const [stats, setStats] = useState<DocumentStats>({
    complete: 0,
    missing: 0,
    sla_breaches: 0,
    generated_at: "",
  });

  useEffect(() => {
    void load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/docs/stats", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as DocumentStats;
      setStats(payload);
    } catch (error) {
      console.error("Document stats fetch failed", error);
    }
  };

  return (
    <section
      role="region"
      aria-label="Document collection status"
      aria-live="polite"
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Document collection</h2>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Snapshot {stats.generated_at ? new Date(stats.generated_at).toLocaleTimeString() : "loading…"}
          </p>
        </div>
      </header>

      <div className="mt-4 space-y-3 text-sm">
        <MetricCard
          label="Complete (5/5)"
          value={stats.complete}
          className={tone.complete}
          description="All required submissions received."
        />
        <MetricCard
          label="Missing documents"
          value={stats.missing}
          className={tone.missing}
          description="Awaiting client uploads."
        />
        <MetricCard
          label="SLA breaches (>14 days)"
          value={stats.sla_breaches}
          className={tone.sla}
          description="Escalate on-call if non-zero."
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  className,
  description,
}: {
  label: string;
  value: number;
  className: string;
  description: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${className}`}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
