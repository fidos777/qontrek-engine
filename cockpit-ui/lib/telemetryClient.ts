// lib/telemetryClient.ts
// Pluggable telemetry client with ring-buffer LocalSink

export type Sink = {
  emit: (name: string, payload: any) => Promise<void>;
};

/**
 * LocalSink stores events in console + localStorage ring buffer.
 * Buffer capped at 200 events, no throw on storage error.
 */
export const LocalSink: Sink = {
  emit: async (name: string, payload: any) => {
    const timestamp = new Date().toISOString();
    const entry = { event: name, payload, timestamp };

    console.log("[TELEMETRY]", JSON.stringify(entry));

    try {
      // Ring buffer in localStorage
      const key = "telemetry_events";
      const stored = localStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];

      events.push(entry);

      // Cap at 200 events (ring buffer)
      if (events.length > 200) {
        events.shift();
      }

      localStorage.setItem(key, JSON.stringify(events));
    } catch (err) {
      // No throw on storage error - silent failure
      console.warn("[TELEMETRY] localStorage write failed:", err);
    }
  },
};

/**
 * Creates a telemetry client with pluggable sink.
 * Defaults to LocalSink if no sink provided.
 */
export function createTelemetry(sink?: Sink): { emit: Sink["emit"] } {
  const activeSink = sink ?? LocalSink;

  return {
    emit: async (name: string, payload: any) => {
      await activeSink.emit(name, payload);
    },
  };
}
