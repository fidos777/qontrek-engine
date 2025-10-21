"use client";

// cockpit/components/tiles/DocTrackerTile.tsx
import { useEffect, useMemo, useState } from "react";

/**
 * Live Doc Tracker tile
 * - Primary source: Supabase REST /rest/v1/documents_sla_view (tenant-scoped)
 * - Fallback: /proof/dashboard/doc_sla_breakdown.json (existing proof)
 *
 * Required env (browser-safe):
 *  NEXT_PUBLIC_SUPABASE_URL
 *  NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  NEXT_PUBLIC_TENANT_ID  (uuid string)
 */

type SlaRow = {
  tenant_id: string;
  breach_7: number;
  breach_14: number;
  breach_21: number;
};

type SlaCounters = {
  breach_7: number;
  breach_14: number;
  breach_21: number;
};

const EMPTY: SlaCounters = { breach_7: 0, breach_14: 0, breach_21: 0 };

// Fetch from Supabase REST API
async function fetchLive(tenantId: string): Promise<SlaCounters | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const url =
    `${base}/rest/v1/documents_sla_view` +
    `?tenant_id=eq.${encodeURIComponent(tenantId)}` +
    `&select=tenant_id,breach_7,breach_14,breach_21&limit=1`;

  const r = await fetch(url, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Accept-Profile": "public",
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error(`REST ${r.status}`);
  const rows: SlaRow[] = await r.json();
  if (Array.isArray(rows) && rows.length) {
    const row = rows[0];
    return {
      breach_7: Number(row.breach_7 ?? 0),
      breach_14: Number(row.breach_14 ?? 0),
      breach_21: Number(row.breach_21 ?? 0),
    };
  }
  return null;
}

// Fallback JSON proof
async function fetchFallback(): Promise<SlaCounters> {
  const r = await fetch("/proof/dashboard/doc_sla_breakdown.json", {
    cache: "no-store",
  });
  if (!r.ok) return EMPTY;
  const j = await r.json();
  return (j?.counters as SlaCounters) ?? EMPTY;
}

export default function DocTrackerTile() {
  const tenantId =
    process.env.NEXT_PUBLIC_TENANT_ID ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tenant_id") ?? ""
      : "");

  const [data, setData] = useState<SlaCounters>(EMPTY);
  const [state, setState] = useState<
    "idle" | "loading" | "ok" | "fallback" | "error"
  >("idle");
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const canQuery = useMemo(
    () =>
      Boolean(
        tenantId &&
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    [tenantId]
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setState("loading");
      try {
        let counters: SlaCounters | null = null;
        if (canQuery) {
          counters = await fetchLive(tenantId);
        }
        if (!counters) {
          counters = await fetchFallback();
          if (!cancelled) setState("fallback");
        } else {
          if (!cancelled) setState("ok");
        }
        if (!cancelled) {
          setData(counters);
          setUpdatedAt(new Date().toISOString());
        }
      } catch {
        try {
          const fb = await fetchFallback();
          if (!cancelled) {
            setData(fb);
            setState("fallback");
            setUpdatedAt(new Date().toISOString());
          }
        } catch {
          if (!cancelled) setState("error");
        }
      }
    }

    load();
    const iv = setInterval(load, 10_000);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(iv);
    };
  }, [tenantId, canQuery]);

  const badge =
    state === "ok"
      ? "LIVE"
      : state === "fallback"
      ? "FALLBACK"
      : state === "loading"
      ? "LOADING"
      : state === "error"
      ? "ERROR"
      : "IDLE";

  return (
    <section
      aria-live="polite"
      className="rounded-2xl shadow-sm border border-gray-200 p-4 bg-white"
    >
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Document Tracker (SLA)
        </h3>
        <span
          aria-label={`data source state: ${badge}`}
          className={`text-xs px-2 py-0.5 rounded ${
            state === "ok"
              ? "bg-green-100 text-green-700"
              : state === "fallback"
              ? "bg-amber-100 text-amber-700"
              : state === "loading"
              ? "bg-blue-100 text-blue-700"
              : state === "error"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {badge}
        </span>
      </header>

      <div
        className="grid grid-cols-3 gap-3"
        role="group"
        aria-label="SLA buckets"
      >
        <Metric label="≥7 days" value={data.breach_7} />
        <Metric label="≥14 days" value={data.breach_14} />
        <Metric label="≥21 days" value={data.breach_21} />
      </div>

      <footer className="mt-3 text-xs text-gray-500">
        <span>Tenant: {tenantId || "-"}</span>
        {updatedAt ? (
          <span className="ml-2">• Updated {updatedAt}</span>
        ) : null}
      </footer>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 text-center">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{Number(value ?? 0)}</div>
    </div>
  );
}

