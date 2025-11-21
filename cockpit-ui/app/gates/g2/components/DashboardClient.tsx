"use client";

import { useEffect, useState, useRef } from "react";
import { logProofLoad } from "@/lib/telemetry";
import type { G2Response } from "@/types/gates";
import Dashboard from "./Dashboard";

async function fetchGate(url: string): Promise<G2Response> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture
    // NOTE: This branch is dead code in production builds.
    // Next.js will tree-shake this entire block when NODE_ENV=production
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/g2.summary.json");
      return mod.default as G2Response;
    }
    throw new Error("G2 summary endpoint unavailable");
  }
}

export default function DashboardClient() {
  const [payload, setPayload] = useState<G2Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const telemetrySent = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetchGate("/api/gates/g2/summary");
        setPayload(resp);
        // Prevent double telemetry in Next.js StrictMode (dev only)
        if (!telemetrySent.current && resp?.rel && resp?.source) {
          logProofLoad(resp.rel, resp.source);
          telemetrySent.current = true;
        }
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600" aria-live="polite">Error: {error}</p>
      </div>
    );
  }

  if (!payload) {
    return <div className="p-6">Loading...</div>;
  }

  return <Dashboard data={payload.data} />;
}
