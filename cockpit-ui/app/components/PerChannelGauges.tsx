import React from "react";

type ChannelStats = {
  ack_rate: number;
  latency_p95_ms: number;
};

interface PerChannelGaugesProps {
  channels: Record<string, ChannelStats>;
}

export function PerChannelGauges({ channels }: PerChannelGaugesProps) {
  const entries = Object.entries(channels);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No channel metrics available.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {entries.map(([channel, stats]) => (
        <div key={channel} className="rounded-md border border-slate-200 p-3 shadow-sm">
          <h3 className="text-sm font-semibold uppercase text-slate-600">{channel}</h3>
          <dl className="mt-2 space-y-1 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <dt>Ack rate</dt>
              <dd className="font-semibold text-slate-900">
                {(stats.ack_rate * 100).toFixed(1)}%
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Latency p95</dt>
              <dd className="font-semibold text-slate-900">
                {(stats.latency_p95_ms / 1000).toFixed(1)}s
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

export default PerChannelGauges;
