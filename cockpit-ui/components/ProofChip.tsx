"use client";

import { useState } from "react";
import { createTelemetry } from "@/lib/telemetryClient";

const telemetry = createTelemetry();

interface ProofChipProps {
  rel: string;
  source: "real" | "fallback";
  etag?: string;
}

export default function ProofChip({ rel, source, etag }: ProofChipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    telemetry.emit("ui.proof_chip.open", { rel, source, etag });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
        aria-label="View proof details"
      >
        <span>🔒</span>
        <span>Proof</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Proof Details</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Relation:</span> <span className="text-gray-700">{rel}</span>
              </div>
              <div>
                <span className="font-medium">Source:</span>{" "}
                <span className={`px-2 py-0.5 rounded ${source === "real" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {source}
                </span>
              </div>
              {etag && (
                <div>
                  <span className="font-medium">ETag:</span> <span className="text-gray-700 font-mono text-xs">{etag}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
