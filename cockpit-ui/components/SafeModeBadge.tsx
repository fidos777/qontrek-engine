"use client";

import { useSafeMode } from "@/lib/safeModeContext";

export default function SafeModeBadge() {
  const { safeMode, setSafeMode } = useSafeMode();

  if (!safeMode) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <span className="font-semibold">Privacy Mode ON</span>
      <button
        onClick={() => setSafeMode(false)}
        className="ml-2 text-xs bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded"
        aria-label="Disable Privacy Mode"
      >
        Disable
      </button>
    </div>
  );
}
