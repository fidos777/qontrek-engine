"use client";
// app/components/ConfidenceMeter.tsx
// ConfidenceMeter - Dynamic 0-100 trust bar

import React, { useState, useEffect } from "react";

interface ConfidenceMeterProps {
  refName: string;
  className?: string;
}

interface ConfidenceFactors {
  etag: boolean;
  ack: boolean;
  schema: boolean;
  rate: number; // 0-1
}

export default function ConfidenceMeter({ refName, className = "" }: ConfidenceMeterProps) {
  const [confidence, setConfidence] = useState<number>(0);
  const [factors, setFactors] = useState<ConfidenceFactors>({
    etag: false,
    ack: false,
    schema: false,
    rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateConfidence = async () => {
      setIsLoading(true);
      const startTime = Date.now();

      try {
        // Fetch proof metadata
        const response = await fetch(`/api/mcp/resources?ref=${refName}`);
        const data = await response.json();

        // Check ETag presence
        const hasEtag = !!data.etag;

        // Check ACK from Tower
        const ackResponse = await fetch("/api/mcp/sync/tower");
        const ackData = await ackResponse.json();
        const hasAck = ackData.ok === true;

        // Check schema validation
        const hasSchema = !!data.schema;

        // Calculate rate (freshness based on timestamp)
        const timestamp = data.timestamp ? new Date(data.timestamp).getTime() : 0;
        const now = Date.now();
        const ageMs = now - timestamp;
        const ageHours = ageMs / (1000 * 60 * 60);
        const freshness = Math.max(0, Math.min(1, 1 - ageHours / 24)); // Decay over 24h

        const newFactors: ConfidenceFactors = {
          etag: hasEtag,
          ack: hasAck,
          schema: hasSchema,
          rate: freshness,
        };

        // Calculate overall confidence (weighted average)
        const score =
          (hasEtag ? 30 : 0) + (hasAck ? 30 : 0) + (hasSchema ? 20 : 0) + freshness * 20;

        setFactors(newFactors);
        setConfidence(Math.round(score));

        // Emit telemetry
        const elapsed = Date.now() - startTime;
        fetch("/api/mcp/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "ui.confidence.score",
            refName,
            confidence: Math.round(score),
            factors: newFactors,
            elapsedMs: elapsed,
            timestamp: Date.now(),
          }),
        }).catch(() => {
          // Silent fail
        });
      } catch (error) {
        console.error("Confidence calculation error:", error);
        setConfidence(0);
      } finally {
        setIsLoading(false);
      }
    };

    calculateConfidence();

    // Listen for proof.updated events
    const handleProofUpdate = (event: CustomEvent) => {
      if (event.detail.ref === refName) {
        calculateConfidence();
      }
    };

    window.addEventListener("proof.updated" as any, handleProofUpdate);

    return () => {
      window.removeEventListener("proof.updated" as any, handleProofUpdate);
    };
  }, [refName]);

  const getColorClass = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return "text-emerald-700";
    if (score >= 50) return "text-amber-700";
    return "text-rose-700";
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-300 animate-pulse" style={{ width: "50%" }} />
        </div>
        <span className="text-xs text-gray-400 font-medium min-w-[3rem] text-right">—</span>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColorClass(confidence)}`}
            style={{ width: `${confidence}%` }}
            role="progressbar"
            aria-valuenow={confidence}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Confidence score: ${confidence}%`}
          />
        </div>
        <span
          className={`text-xs font-bold min-w-[3rem] text-right ${getTextColor(confidence)}`}
        >
          {confidence}%
        </span>
      </div>

      {/* Factors tooltip */}
      <div className="text-xs text-gray-500 flex gap-2">
        <span className={factors.etag ? "text-emerald-600" : "text-gray-400"}>
          {factors.etag ? "✓" : "○"} ETag
        </span>
        <span className={factors.ack ? "text-emerald-600" : "text-gray-400"}>
          {factors.ack ? "✓" : "○"} ACK
        </span>
        <span className={factors.schema ? "text-emerald-600" : "text-gray-400"}>
          {factors.schema ? "✓" : "○"} Schema
        </span>
        <span className={factors.rate > 0.5 ? "text-emerald-600" : "text-amber-600"}>
          {Math.round(factors.rate * 100)}% Fresh
        </span>
      </div>
    </div>
  );
}
