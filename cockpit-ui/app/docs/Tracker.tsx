import React from "react";

type DocSummary = {
  total_documents: number;
  escalated: number;
  warnings: number;
  sla_health_index: number;
  next_review_at: string;
};

type DocumentEntry = {
  doc_id: string;
  document: string;
  tenant: string;
  project: string;
  owner: string;
  age_days: number;
  sla_tiers: number[];
  sla_breached: number[];
  status: string;
  severity: "green" | "amber" | "red";
  next_action: string;
  channel: string;
};

type AlertEntry = {
  generated_at?: string;
  channel?: string;
  severity?: string;
  action?: string;
  result?: string;
};

export type DocTrackerSummary = {
  generated_at: string;
  tenant_id?: string;
  summary: DocSummary;
  documents: DocumentEntry[];
  alerts: AlertEntry[];
  sha256: string;
};

interface TrackerProps {
  summary: DocTrackerSummary;
}

export default function Tracker({ summary }: TrackerProps) {
  const { documents, alerts } = summary;
  const totalDocs = documents.length;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Document Tracker</h1>
          <p className="text-sm text-slate-500">
            Proof snapshot generated {summary.generated_at}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tenant: {summary.tenant_id ?? "n/a"} · Proof SHA {summary.sha256?.slice(0, 10) ?? "n/a"}
        </div>
      </header>

      <SummaryCards summary={summary.summary} totalDocs={totalDocs} />

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">
            SLA Matrix (7 / 14 / 21 / 30 day counters)
          </h2>
        </header>
        <DocTable documents={documents} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Alert Trail</h2>
        </header>
        <AlertList alerts={alerts} />
      </section>
    </section>
  );
}

function SummaryCards({ summary, totalDocs }: { summary: DocSummary; totalDocs: number }) {
  const cards = [
    {
      label: "Total Documents",
      value: totalDocs,
      tone: "neutral" as const,
    },
    {
      label: "Escalated",
      value: summary.escalated,
      tone: summary.escalated > 0 ? ("warning" as const) : ("positive" as const),
    },
    {
      label: "Warnings",
      value: summary.warnings,
      tone: summary.warnings > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "SLA Health Index",
      value: `${summary.sla_health_index.toFixed(1)}%`,
      tone: summary.sla_health_index >= 85 ? ("positive" as const) : ("warning" as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <MetricCard key={card.label} label={card.label} value={card.value} tone={card.tone} />
      ))}
    </div>
  );
}

function DocTable({ documents }: { documents: DocumentEntry[] }) {
  if (!documents.length) {
    return <p className="px-4 py-6 text-sm text-slate-500">No documents tracked.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Document</th>
            <th className="px-3 py-2">Owner</th>
            <th className="px-3 py-2">Tenant</th>
            <th className="px-3 py-2">Age (days)</th>
            <th className="px-3 py-2">SLA Tiers</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Next Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc.doc_id} className={rowTone(doc.severity)}>
              <td className="px-3 py-3">
                <div className="font-semibold text-slate-900">{doc.document}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{doc.project}</div>
              </td>
              <td className="px-3 py-3">
                <p className="text-slate-800">{doc.owner}</p>
                <p className="text-xs text-slate-500">{doc.doc_id}</p>
              </td>
              <td className="px-3 py-3 text-slate-700">{doc.tenant}</td>
              <td className="px-3 py-3 text-slate-900">{doc.age_days}</td>
              <td className="px-3 py-3">
                <SlaBar tiers={doc.sla_tiers} breached={doc.sla_breached} />
              </td>
              <td className="px-3 py-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeTone(doc.severity)}`}>
                  {doc.status}
                </span>
                <p className="mt-1 text-xs text-slate-500">Channel: {doc.channel}</p>
              </td>
              <td className="px-3 py-3 text-slate-800">{doc.next_action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertList({ alerts }: { alerts: AlertEntry[] }) {
  if (!alerts.length) {
    return <p className="px-4 py-6 text-sm text-slate-500">No alerts recorded.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {alerts.map((alert, index) => (
        <li key={`${alert.generated_at}-${index}`} className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">
              {alert.action ?? "notification"} · {alert.channel}
            </span>
            <span className="text-xs uppercase text-slate-500">{alert.generated_at}</span>
          </div>
          <p className="text-xs text-slate-500">
            Severity: {alert.severity ?? "n/a"} · Result: {alert.result ?? "n/a"}
          </p>
        </li>
      ))}
    </ul>
  );
}

function badgeTone(severity: DocumentEntry["severity"]) {
  switch (severity) {
    case "red":
      return "bg-rose-100 text-rose-700";
    case "amber":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function rowTone(severity: DocumentEntry["severity"]) {
  switch (severity) {
    case "red":
      return "bg-rose-50";
    case "amber":
      return "bg-amber-50";
    default:
      return "";
  }
}

function SlaBar({ tiers, breached }: { tiers: number[]; breached: number[] }) {
  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {tiers.map((tier) => {
        const hit = breached.includes(tier);
        return (
          <span
            key={tier}
            className={`rounded-md px-2 py-1 ${
              hit ? "bg-rose-200 text-rose-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {tier}d
          </span>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "neutral" | "warning" | "positive";
}) {
  const palette =
    tone === "positive"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-slate-100 text-slate-700 border border-slate-200";

  return (
    <div className={`rounded-md px-4 py-3 text-sm ${palette}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
