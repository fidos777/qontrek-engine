// Telemetry utility with 60s throttling (reuses stateGrammar logProofLoad)
import { logProofLoad as grammarLog } from "@/lib/stateGrammar";

export function logProofLoad(file: string, source: string) {
  grammarLog(file, source);
}
