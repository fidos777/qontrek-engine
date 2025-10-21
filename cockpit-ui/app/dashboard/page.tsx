"use client";

import DocumentTrackerTile from "../components/dashboard/DocumentTrackerTile";
import TrustUptimeChart from "../components/dashboard/TrustUptimeChart";

export default function OperationalDashboardPage() {
  return (
    <main className="space-y-6 bg-slate-50 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Operational telemetry</h1>
        <p className="mt-1 text-sm text-slate-600">
          Snapshot of document pipeline and platform trust indicators.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <DocumentTrackerTile />
        <TrustUptimeChart />
      </div>
    </main>
  );
}
