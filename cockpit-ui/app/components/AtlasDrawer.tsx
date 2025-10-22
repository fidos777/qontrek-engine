"use client";
// app/components/AtlasDrawer.tsx
// Atlas Federation Awareness UI - v2

import { useState, useEffect } from "react";

interface FederationStatus {
  nodeCount: number;
  towerLatency: number | null;
  streamStatus: "active" | "inactive" | "error";
  lastSync: string | null;
  eventsCount: number;
}

export default function AtlasDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<FederationStatus>({
    nodeCount: 0,
    towerLatency: null,
    streamStatus: "inactive",
    lastSync: null,
    eventsCount: 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    // Fetch federation status
    const fetchStatus = async () => {
      try {
        // Get federation nodes
        const fedRes = await fetch("/api/mcp/federation");
        const fedData = await fedRes.json();

        // Get events count
        const eventsRes = await fetch("/api/mcp/events?stream=true");
        const eventsData = await eventsRes.json();

        // Measure Tower latency (if available)
        let latency = null;
        if (process.env.NEXT_PUBLIC_TOWER_URL) {
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
          nodeCount: fedData.nodes?.length || 1,
          towerLatency: latency,
          streamStatus: eventsData.events ? "active" : "inactive",
          lastSync: fedData.runtime?.timestamp || null,
          eventsCount: eventsData.count || 0,
        });
      } catch (error) {
        setStatus((prev) => ({ ...prev, streamStatus: "error" }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10s

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Atlas Federation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

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

          {/* Last Sync */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">Last Sync</div>
            <div className="text-sm text-gray-900">
              {status.lastSync ? new Date(status.lastSync).toLocaleString() : "Never"}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.open("/api/mcp/resources", "_blank")}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Resources
            </button>
            <button
              onClick={() => window.open("/api/mcp/events?stream=true", "_blank")}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Stream Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
