// lib/telemetry.ts
/**
 * Telemetry utility for proof load tracking
 * In production, this would write to Supabase
 * For demo, it logs to console
 */

export function logProofLoad(
  rel: string,
  source: "real" | "fallback"
): void {
  const timestamp = new Date().toISOString();
  const entry = {
    event: "proof_load",
    rel,
    source,
    timestamp,
    demo_mode: true
  };
  
  console.log("[VOLTEK TELEMETRY]", JSON.stringify(entry, null, 2));
  
  // In production, this would:
  // await supabase.from('telemetry').insert(entry);
}

export function logAction(
  action: string,
  leadId: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const entry = {
    event: "user_action",
    action,
    lead_id: leadId,
    timestamp,
    demo_mode: true,
    ...metadata
  };
  
  console.log("[VOLTEK ACTION]", JSON.stringify(entry, null, 2));
}
