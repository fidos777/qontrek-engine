"use client";
import React from "react";
export default function GovernanceHeaderStrip() {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {["G13 Lineage","G14 Federation","G15 Telemetry","G16 Safety","G18 Status"].map((g)=>
        <span key={g} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{g}</span>
      )}
    </div>
  );
}
export function RateLimitMeterPie({ title="Tenant Rate Limit" }:{ title?: string }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-400" />
        <div className="text-sm text-slate-600"><b>7</b> / 100 req/min</div>
      </div>
    </div>
  );
}
