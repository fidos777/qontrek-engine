// lib/import/telemetry.ts
// Telemetry functions for import data flow

export type ImportEvent = "open" | "validate" | "apply" | "error";

export function logImportEvent(
  event: ImportEvent,
  metadata?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const entry = {
    event: `ui.import.${event}`,
    timestamp,
    ...metadata,
  };

  console.log("[TELEMETRY]", JSON.stringify(entry));

  // In production, this would write to proof/logs/trace.jsonl
}

export function logImportOpen(profile?: string): void {
  logImportEvent("open", { profile });
}

export function logImportValidate(rowCount: number, errorCount: number): void {
  logImportEvent("validate", { rowCount, errorCount });
}

export function logImportApply(rowCount: number, profile: string): void {
  logImportEvent("apply", { rowCount, profile });
}

export function logImportError(error: string, step?: string): void {
  logImportEvent("error", { error, step });
}
