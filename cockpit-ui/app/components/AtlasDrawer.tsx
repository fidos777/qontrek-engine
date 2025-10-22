"use client";
// app/components/AtlasDrawer.tsx
// Atlas Federation Awareness UI - v3 (Trust Fabric)

import { useState, useEffect } from "react";
import GovernanceBadges from "./GovernanceBadges";
import RateLimitMeter from "./RateLimitMeter";

interface FederationStatus {
  mode: "local" | "federated" | "error";
  nodeCount: number;
  towerLatency: number | null;
  streamStatus: "active" | "inactive" | "error";
  lastSync: string | null;
  eventsCount: number;
  federationEnabled: boolean;
}

export default function AtlasDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<FederationStatus>({
    mode: "local",
    nodeCount: 0,
    towerLatency: null,
    streamStatus: "inactive",
    lastSync: null,
    eventsCount: 0,
    federationEnabled: false,
  });

  const [panicMode, setPanicMode] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    // Fetch federation status
    const fetchStatus = async () => {
      try {
        // Get federation config
        const fedRes = await fetch("/api/mcp/federation");
        const fedData = await fedRes.json();

        const federationEnabled = fedData.nodes?.length > 0 && !panicMode;

        // Get events count
        const eventsRes = await fetch("/api/mcp/events?stream=true");
        const eventsData = await eventsRes.json();

        // Measure Tower latency (if federation enabled)
        let latency = null;
        if (federationEnabled && process.env.NEXT_PUBLIC_TOWER_URL) {
          const start = Date.now();
          try {
            await fetch(`${process.env.NEXT_PUBLIC_TOWER_URL}/ping`, {
              method: "HEAD",
              signal: AbortSignal.timeout(3000),
            });
            latency = Date.now() - start;
          } catch {
            latency = null;
          }
        }

        setStatus({
          mode: federationEnabled ? "federated" : "local",
          nodeCount: fedData.nodes?.length || 1,
          towerLatency: latency,
          streamStatus: eventsData.events ? "active" : "inactive",
          lastSync: fedData.runtime?.timestamp || null,
          eventsCount: eventsData.count || 0,
          federationEnabled,
        });
      } catch (error) {
        setStatus((prev) => ({ ...prev, mode: "error", streamStatus: "error" }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10s

    return () => clearInterval(interval);
  }, [isOpen, panicMode]);

  const handlePanicToggle = () => {
    setPanicMode(!panicMode);
    setSyncMessage(
      !panicMode
        ? "⚠️ Federation disabled (Panic mode)"
        : "✅ Federation enabled"
    );
    setTimeout(() => setSyncMessage(""), 3000);
  };

  const handleManualTowerSync = async () => {
    if (panicMode) {
      setSyncMessage("❌ Cannot sync in panic mode");
      setTimeout(() => setSyncMessage(""), 3000);
      return;
    }

    try {
      setSyncMessage("🔄 Syncing with Tower...");
      const response = await fetch("/api/mcp/sync/tower", { method: "POST" });
      const result = await response.json();

      if (response.ok) {
        setSyncMessage(`✅ Tower sync complete (${result.merged || 0} events)`);
      } else {
        setSyncMessage(`❌ ${result.message || "Sync failed"}`);
      }
    } catch (error) {
      setSyncMessage(`❌ Sync error: ${String(error)}`);
    }

    setTimeout(() => setSyncMessage(""), 5000);
  };

  const handleManualTelemetrySync = async () => {
    if (panicMode) {
      setSyncMessage("❌ Cannot sync in panic mode");
      setTimeout(() => setSyncMessage(""), 3000);
      return;
    }

    try {
      setSyncMessage("📊 Uploading telemetry...");
      const response = await fetch("/api/mcp/sync/telemetry", { method: "POST" });
      const result = await response.json();

      if (response.ok) {
        setSyncMessage(`✅ Telemetry upload complete (${result.uploaded || 0} events)`);
      } else {
        setSyncMessage(`❌ ${result.message || "Upload failed"}`);
      }
    } catch (error) {
      setSyncMessage(`❌ Upload error: ${String(error)}`);
    }

    setTimeout(() => setSyncMessage(""), 5000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Atlas Control</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Governance Badges */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
            Governance Status
          </div>
          <GovernanceBadges />
        </div>

        {/* Mode Display */}
        <div className="mb-6 border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">Mode</div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                status.mode === "federated"
                  ? "bg-green-500"
                  : status.mode === "local"
                  ? "bg-blue-500"
                  : "bg-red-500"
              }`}
            ></span>
            <span className="text-2xl font-bold capitalize">{status.mode}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {status.mode === "federated" && "Connected to Tower"}
            {status.mode === "local" && "Standalone mode (demo-safe)"}
            {status.mode === "error" && "Connection error"}
          </div>
        </div>

        {/* Panic Toggle */}
        <div className="mb-6">
          <button
            onClick={handlePanicToggle}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
              panicMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            {panicMode ? "🚨 PANIC MODE ON" : "🛡️ Panic Toggle (OFF)"}
          </button>
          <div className="text-xs text-gray-600 mt-1 text-center">
            Click to instantly disable federation
          </div>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            {syncMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Node Count */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Federated Nodes</div>
            <div className="text-3xl font-bold text-gray-900">{status.nodeCount}</div>
          </div>

          {/* Tower Latency */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Tower Latency</div>
            <div className="text-3xl font-bold text-gray-900">
              {status.towerLatency !== null ? `${status.towerLatency}ms` : "—"}
            </div>
          </div>

          {/* Stream Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Event Stream</div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  status.streamStatus === "active"
                    ? "bg-green-500"
                    : status.streamStatus === "inactive"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span className="text-lg font-semibold capitalize">{status.streamStatus}</span>
            </div>
          </div>

          {/* Events Count */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-3xl font-bold text-gray-900">{status.eventsCount}</div>
          </div>

          {/* Rate Limit Meter */}
          <RateLimitMeter />

          {/* Last Sync */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Last Sync</div>
            <div className="text-sm text-gray-900">
              {status.lastSync ? new Date(status.lastSync).toLocaleString() : "Never"}
            </div>
          </div>

          {/* Manual Sync Controls */}
          <div className="mt-6 space-y-2">
            <button
              onClick={handleManualTowerSync}
              disabled={panicMode}
              className={`w-full px-4 py-2 rounded-md ${
                panicMode
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              🔄 Sync with Tower
            </button>
            <button
              onClick={handleManualTelemetrySync}
              disabled={panicMode}
              className={`w-full px-4 py-2 rounded-md ${
                panicMode
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              📊 Upload Telemetry
            </button>
          </div>

          {/* Discovery Actions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.open("/api/mcp/resources", "_blank")}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              📚 View Resources
            </button>
            <button
              onClick={() => window.open("/api/mcp/events?stream=true", "_blank")}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              📡 Stream Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
