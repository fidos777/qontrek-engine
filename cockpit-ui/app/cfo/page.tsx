"use client";

import { useEffect, useState } from "react";
import CfoLens, { CfoSummary } from "./CfoLens";

export default function CfoLensPage() {
  const [summary, setSummary] = useState<CfoSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/proof/cfo_summary.json");
      if (response.ok) {
        const data = (await response.json()) as CfoSummary;
        setSummary(data);
      }
    };
    load().catch((error) => console.error("Failed to load CFO summary", error));
  }, []);

  if (!summary) {
    return <div className="p-8 text-center text-slate-500">Loading finance telemetry…</div>;
  }

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <CfoLens summary={summary} />
    </main>
  );
}
