"use client";
import React from "react";
export default function ConfidenceMeterAnimated({ source="/proof/signals.json" }:{ source?: string }) {
  return (
    <div className="w-full h-10 rounded-lg border border-emerald-300 bg-emerald-50 px-3 flex items-center justify-between">
      <span className="text-sm font-medium text-emerald-800">Trust Index</span>
      <div className="h-2 flex-1 mx-3 bg-white/70 rounded">
        <div className="h-2 w-4/5 bg-emerald-500 rounded"></div>
      </div>
      <span className="text-sm font-semibold text-emerald-700">100%</span>
    </div>
  );
}
export function ProofChipV3({ refName, label="Proof" }:{ refName: string; label?: string }) {
  return (
    <button
      type="button"
      className="ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
      aria-label={`Open proof for ${refName}`}
    >
      <span aria-hidden>🔗</span>{label}
    </button>
  );
}
