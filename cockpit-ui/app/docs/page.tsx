"use client";

import { useEffect, useState } from "react";
import Tracker, { DocTrackerSummary } from "./Tracker";

export default function DocTrackerPage() {
  const [summary, setSummary] = useState<DocTrackerSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/proof/doc_tracker_summary.json");
      if (response.ok) {
        const data = (await response.json()) as DocTrackerSummary;
        setSummary(data);
      }
    };
    load().catch((error) => console.error("Failed to load doc tracker summary", error));
  }, []);

  if (!summary) {
    return <div className="p-8 text-center text-slate-500">Loading document telemetry…</div>;
  }

  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <Tracker summary={summary} />
    </main>
  );
}
