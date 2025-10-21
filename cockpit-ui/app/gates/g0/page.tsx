"use client";

import { useEffect, useState } from "react";

type Gate0Lead = {
  id: string;
  name: string;
  score: number;
  decision: "AUTO_APPROVE" | "MANUAL_REVIEW" | "AUTO_REJECT";
  flags: string[];
  tnb_bill: number;
  source: string;
  created_at: string;
};

type Gate0Summary = {
  auto_approved: number;
  pending_review: number;
  auto_rejected: number;
  today_total: number;
};

type Gate0Payload = {
  summary: Gate0Summary;
  pending_review: Gate0Lead[];
  recent_approvals: Gate0Lead[];
};

const cardTone = [
  "from-emerald-500/10 to-emerald-500/5 border-emerald-500/40",
  "from-amber-500/10 to-amber-500/5 border-amber-500/40",
  "from-rose-500/10 to-rose-500/5 border-rose-500/40",
  "from-blue-500/10 to-blue-500/5 border-blue-500/40",
];

export default function Gate0Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Gate0Summary>({
    auto_approved: 0,
    pending_review: 0,
    auto_rejected: 0,
    today_total: 0,
  });
  const [pendingLeads, setPendingLeads] = useState<Gate0Lead[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<Gate0Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/gates/g0/summary", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Summary request failed (${response.status})`);
      }

      const data = (await response.json()) as Gate0Payload;
      setSummary(data.summary);
      setPendingLeads(data.pending_review);
      setRecentApprovals(data.recent_approvals);
      setError(null);
    } catch (err) {
      console.error("Failed to load Gate 0 data", err);
      setError("Unable to load lead qualification telemetry.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (leadId: string, decision: "APPROVE" | "REJECT") => {
    try {
      await fetch("/api/gates/g0/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, decision }),
      });

      await load();
      await fetch("/api/proof/log", {
        method: "POST",
        body: JSON.stringify({
          event: "gate0_manual_decision",
          lead_id: leadId,
          decision,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Manual decision failed", err);
      setError("Decision failed — please retry.");
    }
  };

  if (loading) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading Gate 0 telemetry…
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gate 0 · Lead Qualification</h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter marginal leads (score 50-69) before handoff. Objective: reduce refund rate from 31.8% to {"<"}10%.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-700">
          Live queue
        </span>
      </header>

      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section
        role="region"
        aria-label="Gate 0 daily summary"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Auto-approved", value: summary.auto_approved, hint: ratio(summary.auto_approved, summary.today_total) },
          { label: "Pending manual review", value: summary.pending_review, hint: "Score 50 – 69" },
          { label: "Auto-rejected", value: summary.auto_rejected, hint: ratio(summary.auto_rejected, summary.today_total) },
          { label: "Total leads today", value: summary.today_total, hint: "Across all sources" },
        ].map((card, index) => (
          <div
            key={card.label}
            className={`rounded-lg border bg-gradient-to-br p-5 text-slate-900 shadow-sm ${cardTone[index] ?? cardTone[0]}`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </div>
        ))}
      </section>

      <section
        role="region"
        aria-live="polite"
        aria-label="Pending manual review queue"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">🟡 Manual review queue (score 50 – 69)</h2>
            <p className="text-sm text-slate-500">
              Prioritise leads flagged by the qualification engine. Actions update proof logs automatically.
            </p>
          </div>
          <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {pendingLeads.length} awaiting decision
          </span>
        </div>

        {pendingLeads.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Queue clear — all marginal leads reviewed.
          </p>
        ) : (
          <ul className="space-y-4">
            {pendingLeads.map((lead) => (
              <li
                key={lead.id}
                className="rounded-lg border-l-4 border-amber-400 bg-amber-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">{lead.name}</p>
                      <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-white">
                        Score {lead.score}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{lead.source}</span>
                    </div>
                    <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-500">TNB bill</dt>
                        <dd className="mt-0.5 text-slate-900">RM {lead.tnb_bill.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">Submitted</dt>
                        <dd className="mt-0.5 text-slate-900">
                          {new Date(lead.created_at).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                    {lead.flags.length ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {lead.flags.map((flag) => (
                          <span key={flag} className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700">
                            ⚠️ {flag.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      aria-label={`Approve ${lead.name}`}
                      onClick={() => handleDecision(lead.id, "APPROVE")}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      ✅ Approve
                    </button>
                    <button
                      type="button"
                      aria-label={`Reject ${lead.name}`}
                      onClick={() => handleDecision(lead.id, "REJECT")}
                      className="rounded-md border border-rose-500/40 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                    >
                      ✖ Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        role="region"
        aria-live="polite"
        aria-label="Recent auto approvals"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">✅ Auto-approved (score ≥ 70)</h2>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Showing {Math.min(recentApprovals.length, 5)} of {recentApprovals.length}
          </span>
        </div>
        {recentApprovals.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No auto-approvals captured in the last hour.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {recentApprovals.slice(0, 5).map((lead) => (
              <li
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-emerald-500/5 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-slate-900">{lead.name}</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Score {lead.score}
                  </span>
                  <span className="text-xs text-slate-500">RM {lead.tnb_bill.toLocaleString()}</span>
                </div>
                <time
                  dateTime={lead.created_at}
                  className="font-mono text-xs text-slate-500"
                >
                  {new Date(lead.created_at).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}
