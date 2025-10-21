"use client";

import { useEffect, useMemo, useState } from "react";

type Gate1Lead = {
  id: string;
  name: string;
  intent_score: number;
  last_activity: string;
  next_action: string;
  stage: string;
};

type Gate1Nudge = {
  time: string;
  lead_name: string;
  nudge_type: string;
  status: string;
};

type Gate1Summary = {
  funnel: {
    quotes_sent: number;
    faq_opened: number;
    social_proof_clicked: number;
    site_visit_booked: number;
    conversion_rate: number;
  };
  hot_leads: Gate1Lead[];
  scheduled_nudges: Gate1Nudge[];
};

export default function Gate1Dashboard() {
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<Gate1Summary>({
    funnel: {
      quotes_sent: 0,
      faq_opened: 0,
      social_proof_clicked: 0,
      site_visit_booked: 0,
      conversion_rate: 0,
    },
    hot_leads: [],
    scheduled_nudges: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 5_000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/gates/g1/summary", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed with code ${response.status}`);
      }
      const data = (await response.json()) as Gate1Summary;
      setTelemetry(data);
      setError(null);
    } catch (err) {
      console.error("Gate 1 summary error", err);
      setError("Unable to load decision engine metrics.");
    } finally {
      setLoading(false);
    }
  };

  const funnelStages = useMemo(
    () => [
      {
        label: "Quotes sent (H+0)",
        value: telemetry.funnel.quotes_sent,
        description: "Initial quote delivered after qualification",
      },
      {
        label: "FAQ opened (H+4)",
        value: telemetry.funnel.faq_opened,
        description: "Auto-nudge to FAQ library",
      },
      {
        label: "Social proof clicked (H+12)",
        value: telemetry.funnel.social_proof_clicked,
        description: "Case studies & testimonials engagement",
      },
      {
        label: "Site visit booked (H+20)",
        value: telemetry.funnel.site_visit_booked,
        description: "Calendly booking confirmed",
      },
    ],
    [telemetry],
  );

  const handleCallLead = async (lead: Gate1Lead) => {
    try {
      await fetch("/api/proof/log", {
        method: "POST",
        body: JSON.stringify({
          event: "gate1_manual_call",
          lead_id: lead.id,
          timestamp: new Date().toISOString(),
        }),
      });
      alert(`Calling ${lead.name} (${lead.id})`);
    } catch (err) {
      console.error("Call lead failed", err);
      setError("Unable to log call action.");
    }
  };

  if (loading) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading Gate 1 telemetry…
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gate 1 · Decision Engine</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tracks automated nudges scheduled at H+4, H+12, H+20 with live funnel conversion.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-sm font-medium text-blue-700">
          Auto-engagement active
        </span>
      </header>

      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section
        role="region"
        aria-label="Funnel performance"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">📊 Today&apos;s funnel</h2>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Conversion {telemetry.funnel.conversion_rate}%
          </span>
        </div>
        <ul className="space-y-3 text-sm">
          {funnelStages.map((stage) => (
            <li key={stage.label} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">{stage.label}</p>
                <p className="text-xs text-slate-500">{stage.description}</p>
              </div>
              <span className="rounded-md bg-slate-900/90 px-3 py-1 text-sm font-semibold text-white">
                {stage.value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        role="region"
        aria-live="polite"
        aria-label="High intent leads"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">🔥 High intent leads (score ≥ 85)</h2>
          <span className="text-xs text-slate-500">
            Updated every 5 seconds • {telemetry.hot_leads.length} leads tracked
          </span>
        </div>
        {telemetry.hot_leads.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No high-intent leads detected right now.
          </p>
        ) : (
          <ul className="space-y-4">
            {telemetry.hot_leads.map((lead) => (
              <li
                key={lead.id}
                className="rounded-lg border border-orange-400/40 bg-orange-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">{lead.name}</p>
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        Intent {lead.intent_score}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{lead.stage}</span>
                    </div>
                    <p className="text-sm text-slate-700">{lead.next_action}</p>
                    <p className="text-xs text-slate-500">
                      Last activity: {new Date(lead.last_activity).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      aria-label={`Call ${lead.name}`}
                      onClick={() => handleCallLead(lead)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      📞 Call lead
                    </button>
                    <button
                      type="button"
                      aria-label={`Open WhatsApp to message ${lead.name}`}
                      onClick={() => window.open(`https://wa.me/6011${lead.id.slice(-4)}`, "_blank")}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                    >
                      💬 WhatsApp
                    </button>
                    <button
                      type="button"
                      aria-label={`Send email to ${lead.name}`}
                      onClick={() => window.open(`mailto:ops+${lead.id}@qontrek.io`)}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                    >
                      ✉ Email
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
        aria-label="Scheduled nudges"
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">🗓 Upcoming nudges (next 6 hours)</h2>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {telemetry.scheduled_nudges.length} queued
          </span>
        </div>

        {telemetry.scheduled_nudges.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Scheduler idle — no nudges in the next six hours.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {telemetry.scheduled_nudges.map((nudge) => (
              <li
                key={`${nudge.lead_name}-${nudge.time}-${nudge.nudge_type}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-blue-500/5 px-3 py-2"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-medium text-slate-900">{nudge.lead_name}</span>
                  <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {nudge.nudge_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <time
                    dateTime={nudge.time}
                    className="font-mono text-xs text-slate-500"
                  >
                    {new Date(nudge.time).toLocaleTimeString()}
                  </time>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs uppercase text-slate-600">
                    {nudge.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
