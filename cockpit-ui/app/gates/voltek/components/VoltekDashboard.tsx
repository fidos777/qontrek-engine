"use client";

export default function VoltekDashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-1)]">
          Voltek Recovery Dashboard
        </h1>
        <div className="text-sm text-[var(--text-2)]">
          RM180k Pipeline &bull; Reconstructed Dataset
        </div>
      </div>

      {/* KPI Cards Row - Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="text-sm text-[var(--text-2)]">KPI {i}</div>
            <div className="text-2xl font-bold text-[var(--text-1)] mt-2">
              --
            </div>
          </div>
        ))}
      </div>

      {/* Lead Table - Placeholder */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="text-sm font-semibold text-[var(--text-2)] mb-3">
          Critical Leads
        </div>
        <div className="text-[var(--text-2)]">
          Data integration in next phase...
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-2)]">
        Voltek Recovery Dashboard v1.5 &bull; Qontrek Engine
      </div>
    </div>
  );
}
