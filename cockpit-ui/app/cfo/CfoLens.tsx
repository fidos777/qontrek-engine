import React, { useMemo, useState } from "react";

type AgingBucket = {
  label: string;
  amount: number;
  invoice_count: number;
};

type RecoveryCohort = {
  cohort: string;
  collected_pct: number;
  open_exceptions: number;
};

type ExceptionItem = {
  id: string;
  tenant: string;
  amount: number;
  reason: string;
  status: string;
};

type TrustIndex = {
  score: number;
  cloud_parity_ok?: boolean;
  cloud_verified_at?: string;
};

export type CfoSummary = {
  generated_at: string;
  trust_index: TrustIndex;
  ar_aging: {
    buckets: AgingBucket[];
    total_outstanding: number;
  };
  dso: {
    current: number;
    trend_7d: number;
    trend_30d: number;
    projected_90d: number;
  };
  recovery_cohorts: RecoveryCohort[];
  exceptions: ExceptionItem[];
};

interface CfoLensProps {
  summary: CfoSummary;
}

const tabs = [
  { id: "aging", label: "A/R Aging" },
  { id: "dso", label: "DSO Trends" },
  { id: "cohorts", label: "Recovery Cohorts" },
  { id: "exceptions", label: "Exceptions" },
  { id: "profitability", label: "Profitability" },
  { id: "risk", label: "Risk" },
];

export default function CfoLens({ summary }: CfoLensProps) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
  const trust = summary.trust_index;
  const totalOutstanding = summary.ar_aging.total_outstanding;

  const topException = useMemo(() => summary.exceptions[0], [summary.exceptions]);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">CFO Lens</h1>
          <p className="text-sm text-slate-500">Finance intelligence snapshot</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TrustBadge trust={trust} />
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs uppercase text-slate-500">Total Outstanding</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>
      </header>

      <nav className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div>
        {activeTab === "aging" && <AgingBuckets buckets={summary.ar_aging.buckets} />}
        {activeTab === "dso" && <DsoPanel dso={summary.dso} />}
        {activeTab === "cohorts" && <CohortsPanel cohorts={summary.recovery_cohorts} />}
        {activeTab === "exceptions" && <ExceptionsPanel exceptions={summary.exceptions} />}
        {activeTab === "profitability" && <TabLinkCard href="/cfo/profitability" description="Gross margin, cost stack, and runway insights." />}
        {activeTab === "risk" && <TabLinkCard href="/cfo/risk" description="Exposure heatmap and intervention tooling." />}
      </div>

      {topException && (
        <footer className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <strong className="font-semibold">Escalation watch:</strong> {topException.id} ·{" "}
          {topException.reason} ({formatCurrency(topException.amount)})
        </footer>
      )}
    </section>
  );
}

function AgingBuckets({ buckets }: { buckets: AgingBucket[] }) {
  return (
    <div className="space-y-3">
      {buckets.map((bucket) => (
        <div
          key={bucket.label}
          className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-slate-600">{bucket.label}</p>
            <p className="text-xs text-slate-500">{bucket.invoice_count} invoices</p>
          </div>
          <p className="text-base font-semibold text-slate-900">{formatCurrency(bucket.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function DsoPanel({
  dso,
}: {
  dso: { current: number; trend_7d: number; trend_30d: number; projected_90d: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <MetricCard label="Current DSO" value={`${dso.current.toFixed(1)} days`} tone="primary" />
      <MetricCard
        label="Projected 90d"
        value={`${dso.projected_90d.toFixed(1)} days`}
        tone="neutral"
      />
      <MetricCard
        label="7-day delta"
        value={`${formatDelta(dso.trend_7d)} days`}
        tone={dso.trend_7d <= 0 ? "positive" : "warning"}
      />
      <MetricCard
        label="30-day delta"
        value={`${formatDelta(dso.trend_30d)} days`}
        tone={dso.trend_30d <= 0 ? "positive" : "warning"}
      />
    </div>
  );
}

function CohortsPanel({ cohorts }: { cohorts: RecoveryCohort[] }) {
  return (
    <table className="min-w-full table-auto text-sm">
      <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-3 py-2">Cohort</th>
          <th className="px-3 py-2">Collected</th>
          <th className="px-3 py-2">Open Exceptions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {cohorts.map((cohort) => (
          <tr key={cohort.cohort}>
            <td className="px-3 py-2 font-medium text-slate-700">{cohort.cohort}</td>
            <td className="px-3 py-2 text-slate-900">{(cohort.collected_pct * 100).toFixed(1)}%</td>
            <td className="px-3 py-2 text-slate-700">{cohort.open_exceptions}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExceptionsPanel({ exceptions }: { exceptions: ExceptionItem[] }) {
  if (!exceptions.length) {
    return <p className="text-sm text-slate-500">No open exceptions — all clear.</p>;
  }
  return (
    <div className="space-y-3">
      {exceptions.map((item) => (
        <div
          key={item.id}
          className="rounded-md border border-rose-100 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{item.id}</span>
            <span className="rounded-md bg-white px-2 py-0.5 text-xs uppercase">
              {item.status}
            </span>
          </div>
          <p className="mt-1">{item.reason}</p>
          <p className="mt-1 text-xs text-rose-600">
            Tenant: {item.tenant} · Exposure {formatCurrency(item.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "neutral" | "positive" | "warning";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
      : tone === "positive"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className={`rounded-md border px-4 py-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function TrustBadge({ trust }: { trust: TrustIndex }) {
  const ok = trust.cloud_parity_ok;
  let colorClass =
    "border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100";
  let label = "Trust Index";
  if (ok === true) {
    colorClass =
      "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100";
  } else if (ok === false) {
    colorClass = "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";
  }
  return (
    <div className={`rounded-md px-3 py-2 text-sm font-semibold transition ${colorClass}`}>
      {label}: {trust.score.toFixed(1)}
    </div>
  );
}

function TabLinkCard({ href, description }: { href: string; description: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
      <p className="text-base font-semibold text-slate-900">View detailed dashboard</p>
      <p className="mt-2">{description}</p>
      <a
        href={href}
        className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
      >
        Open {href}
      </a>
    </div>
  );
}
