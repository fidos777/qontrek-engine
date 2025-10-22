// Telemetry utility with 60s throttling (reuses stateGrammar logProofLoad)
// Uses composite (proofRef, route) keys for unique tracking
import { logProofLoad as grammarLog } from "@/lib/stateGrammar";

export function logProofLoad(proofRef: string, route: string, meta?: Record<string, any>) {
  grammarLog(proofRef, route, meta);
}
