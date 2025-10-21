"use client";

import { useEffect, useState } from "react";

type ExceptionItem = {
  id: string;
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  value: number;
  threshold: number;
  detected_at: string;
};

type ExceptionsResponse = {
  generated_at: string;
  exceptions: ExceptionItem[];
};

const severityTone: Record<ExceptionItem["severity"], string> = {
  HIGH: "border-rose-500 bg-rose-500/10 text-rose-700",
  MEDIUM: "border-amber-500 bg-amber-500/10 text-amber-700",
  LOW: "border-blue-500 bg-blue-500/10 text-blue-700",
};

export default function ExceptionsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExceptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const response = await fetch("/api/cfo/exceptions", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as ExceptionsResponse;
      setData(payload);
      setError(null);
    } catch (err) {
      console.error("CFO exceptions fetch failed", err);
      setError("Unable to load CFO exception list.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading exception telemetry…
        </div>
      </main>
    );
  }

  if (!data || error) {
    return (
      <main className="bg-slate-50 p-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error ?? "No exception data available."}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">CFO Lens · Exceptions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time watchlist for anomalies above tolerance. Updated {formatRelative(data.generated_at)}.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1 text-sm font-medium text-rose-700">
          {data.exceptions.length} active
        </span>
      </header>

      <section
        role="region"
        aria-live="polite"
        aria-label="Active exceptions"
        className="space-y-4"
      >
        {data.exceptions.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
            ✅ No exceptions detected. All metrics within tolerance.
          </div>
        ) : (
          data.exceptions.map((exception) => (
            <article
              key={exception.id}
              className={`rounded-lg border px-5 py-4 shadow-sm transition ${severityTone[exception.severity]}`}
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide">{exception.id}</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {exception.severity}
                  </span>
                </div>
                <time dateTime={exception.detected_at} className="text-xs uppercase text-slate-600">
                  Detected {formatRelative(exception.detected_at)}
                </time>
              </header>
              <p className="mt-3 text-sm">{exception.description}</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Current value</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {formatCurrency(exception.value)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Threshold</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {formatCurrency(exception.threshold)}
                  </dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function formatRelative(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}
