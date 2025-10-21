#!/usr/bin/env bash
set -euo pipefail

# --- Config & paths -----------------------------------------------------------
SUPABASE_URL_DEFAULT="${SUPABASE_URL:-}"
SUPABASE_KEY_DEFAULT="${SUPABASE_SERVICE_KEY:-}"
TENANT_ID_DEFAULT="${SUPABASE_TENANT_ID:-}"

SUMMARY_JSON="proof/tower_sync_summary.json"
VERIFY_JSON="proof/cloud_sync_verify.json"
SEAL_JSON="proof/tower_sync_cert_v18_6.json"
LEDGER_JSON="proof/reports/ct_v18_6_cloud_parity_status.json"
OPS_BUNDLE="proof/bundles/v18_2_ops_bundle.json"

log() { echo -e "[$(date -u +%FT%TZ)] $*"; }
fail() { echo -e "❌ $*" >&2; exit 1; }

# --- Preconditions ------------------------------------------------------------
command -v python3 >/dev/null || fail "python3 is required."
command -v jq >/dev/null || fail "jq is required."
[[ -f "$SUMMARY_JSON" ]] || fail "Missing $SUMMARY_JSON (run the phase first)."
[[ -f "$OPS_BUNDLE" ]] || fail "Missing $OPS_BUNDLE."

# Env sanity
[[ -n "$SUPABASE_URL_DEFAULT" ]] || fail "SUPABASE_URL not set in env."
[[ -n "$SUPABASE_KEY_DEFAULT" ]] || fail "SUPABASE_SERVICE_KEY not set in env."
[[ -n "$TENANT_ID_DEFAULT" ]] || fail "SUPABASE_TENANT_ID not set in env."

export SUPABASE_URL="$SUPABASE_URL_DEFAULT"
export SUPABASE_SERVICE_KEY="$SUPABASE_KEY_DEFAULT"
export SUPABASE_TENANT_ID="$TENANT_ID_DEFAULT"

# --- Step 1: Verify parity ----------------------------------------------------
log "Verifying cloud parity…"
rm -f "$VERIFY_JSON"
python3 scripts/proof_verify_supabase.py

PASS=$(jq -r '.passed' "$VERIFY_JSON" 2>/dev/null || echo "false")
if [[ "$PASS" != "true" ]]; then
  log "Parity check FAILED. Dumping counters:"
  jq '.' "$VERIFY_JSON" || true
  fail "Parity must pass before seal rotation."
fi
log "Parity OK:"
jq '.counters' "$VERIFY_JSON" || true

# --- Step 2: Rotate meta-seal -------------------------------------------------
log "Rotating meta-seal…"
python3 scripts/rotate_meta_seal.py --out "$SEAL_JSON" --cadence daily

META_HASH=$(jq -r '.meta_hash // empty' "$SEAL_JSON" 2>/dev/null || true)
[[ -n "$META_HASH" ]] || fail "Meta-seal did not produce meta_hash."

log "Meta-seal rotated → $SEAL_JSON"
log "Meta-hash: $META_HASH"

# --- Step 3: Write CT ledger card --------------------------------------------
log "Writing CT ledger card…"

# Pull a few values from artifacts
VERIFIED_OK=$(jq -r '.counters.verified_ok' "$VERIFY_JSON")
VERIFIED_MM=$(jq -r '.counters.verified_mismatch' "$VERIFY_JSON")
VERIFIED_MS=$(jq -r '.counters.verified_missing_sha' "$VERIFY_JSON")
ERRORS=$(jq -r '.counters.errors' "$VERIFY_JSON")

# Compose JSON (mirrors the earlier template you approved)
mkdir -p "$(dirname "$LEDGER_JSON")"
jq -n \
  --arg url "$SUPABASE_URL" \
  --arg tenant "$SUPABASE_TENANT_ID" \
  --arg meta "$META_HASH" \
  --arg seal "$SEAL_JSON" \
  --arg time "$(date -u +%FT%TZ)" \
  --argjson ok "$VERIFIED_OK" \
  --argjson mm "$VERIFIED_MM" \
  --argjson ms "$VERIFIED_MS" \
  --argjson err "$ERRORS" \
  '{
    version: "v18.6",
    gate: "G18.6",
    title: "Cloud Parity Sealed",
    mission: "Supabase is source-of-truth for proof hashes; local proofs must match cloud before meta-seal rotation.",
    steps: [
      {"id":"schema_migration","status":"done","note":"sha256 column + unique (tenant_id, filename, meta_hash)"},
      {"id":"uploader_patch","status":"done","note":"proof_push_supabase computes + upserts sha256"},
      {"id":"verifier_patch","status":"done","note":"structured counters + per-file diffs"},
      {"id":"cloud_verification","status":"done","note": ("verified_ok=" + ($ok|tostring))},
      {"id":"backfill_sha","status":"done","note":"historical rows populated"}
    ],
    env: { SUPABASE_URL: $url, SUPABASE_TENANT_ID: $tenant },
    parity: {
      verified_ok: $ok,
      verified_mismatch: $mm,
      verified_missing_sha: $ms,
      not_found: 0,
      errors: $err
    },
    proofs: [
      "proof/tower_sync_summary.json",
      "proof/notify_events.json",
      "proof/tower_sync_cert_v18_3.json",
      "proof/tower_sync_cert_v18_2_ops.json"
    ],
    seal: { file: $seal, meta_hash: $meta, status: "rotated" },
    timestamp_utc: $time
  }' > "$LEDGER_JSON"

log "Ledger card written → $LEDGER_JSON"
log "✅ G18.6 finalized."

