#!/usr/bin/env bash
set -euo pipefail

mkdir -p proof

jq -n --arg ts "$(date -u +%FT%TZ)" \
"{
  gate:\"G19.1\", phase:\"certify\", status:\"unsealed\",
  sealed_at:null, sealed_by:null, seal_hash:null,
  manifest_path:\"manifest_frontend_v19_1.yaml\", sha256:null,
  lineage:{ parent_proof:\"proof/ui_build_v19_1.json\", parent_hash:null },
  merkle:{ root:null, leaves:[] },
  generated_at:\$ts, reason:\"fallback used\"
}" > proof/v19_1_frontend_certification.json

jq -e "has(\"gate\") and has(\"phase\") and has(\"status\") and has(\"generated_at\")" \
  proof/v19_1_frontend_certification.json >/dev/null

CERT_SHA="$(shasum -a 256 proof/v19_1_frontend_certification.json | awk '{print $1}')"
echo "cert_sha256=${CERT_SHA}" > proof/v19_1_frontend_certification.sha
echo "✅ wrote fallback cert (unsealed) + .sha"
