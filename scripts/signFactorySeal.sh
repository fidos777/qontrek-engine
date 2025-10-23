#!/bin/bash
#
# Sign Factory Runtime Seal with Sigstore/COSIGN
#
# Optional supply-chain attestation for factory_runtime_seal.json
# Requires cosign to be installed: https://github.com/sigstore/cosign
#
# Usage: ./scripts/signFactorySeal.sh

set -e

SEAL_FILE="proof/factory_runtime_seal.json"
ATTESTATION_FILE="proof/factory_runtime_seal.json.sig"

echo "=== Factory Seal Sigstore Attestation ==="

# Check if cosign is available
if ! command -v cosign &> /dev/null; then
    echo "⚠️  cosign not found - skipping attestation"
    echo "Install: https://github.com/sigstore/cosign"
    exit 0
fi

# Check if seal exists
if [ ! -f "$SEAL_FILE" ]; then
    echo "❌ Factory seal not found: $SEAL_FILE"
    exit 1
fi

# Sign with keyless mode (uses OIDC identity)
echo "Signing factory seal with Sigstore..."

# Sign the seal file
cosign sign-blob \
    --yes \
    --bundle "${ATTESTATION_FILE}" \
    "${SEAL_FILE}"

echo ""
echo "✅ Factory seal signed"
echo "   Seal: ${SEAL_FILE}"
echo "   Signature bundle: ${ATTESTATION_FILE}"

# Verify signature
echo ""
echo "Verifying signature..."
cosign verify-blob \
    --bundle "${ATTESTATION_FILE}" \
    "${SEAL_FILE}"

echo ""
echo "✅ Signature verified successfully"
