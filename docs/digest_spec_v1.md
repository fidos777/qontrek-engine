# Proof Digest Specification v1.0

**Version**: 1.0
**Status**: Active
**Last Updated**: 2025-01-22
**Release**: G19.9.2-R1.4.4

## Abstract

This document defines a deterministic, reproducible method for computing cryptographic digests of proof artifacts. The goal is to enable "works everywhere" verification: the same proof directory must yield byte-identical digests regardless of machine, locale, or timestamp.

## Motivation

Proof artifacts (e.g., JSON files in `/proof/`) document system security, governance, and lineage properties. Without a deterministic digest:
- **Reproducibility fails**: Different machines produce different hashes
- **Verification is unreliable**: Tower cannot verify digest authenticity
- **Chain continuity breaks**: Daily digests cannot form append-only chain

This specification ensures:
1. **Byte-identical digests** when regenerated on the same proof set
2. **Merkle root continuity** with prev_root chaining
3. **Auditable provenance** via stable hash trees

## Requirements

### R1: Canonical JSON Serialization
All JSON files MUST be normalized before hashing:
- **Keys sorted**: Alphabetically, recursively through nested objects
- **Whitespace**: 2-space indentation, LF (`\n`) newlines only (no CRLF)
- **No trailing whitespace**: Lines trimmed
- **Final newline**: File ends with single `\n`
- **Unicode normalization**: NFC (Normalization Form Canonical Composition)

### R2: Deterministic File Ordering
Files MUST be processed in lexicographic order by relative path:
- Sort by filename: `proof/a.json` before `proof/b.json`
- Case-sensitive: `A.json` before `a.json` (ASCII order)
- Stable sort: If filenames match, use full path

### R3: Excluded Patterns
The following files/patterns MUST be excluded from digest computation:
- `proof/proof_digest_*.json` (digest files themselves)
- `proof/.DS_Store`, `proof/Thumbs.db` (OS metadata)
- `proof/*.tmp`, `proof/*.bak` (temporary/backup files)
- Any file matching glob: `proof/**/.git*`

### R4: Hash Algorithm
- **Leaf hashes**: SHA-256 of canonical JSON bytes
- **Tree hashes**: SHA-256 of concatenated child hashes
- **Output format**: Lowercase hexadecimal (64 characters)

### R5: Merkle Tree Construction
Given N proof files with hashes [h₀, h₁, ..., hₙ₋₁]:
1. If N = 0: root = SHA-256("")
2. If N = 1: root = h₀
3. If N > 1: Build binary tree bottom-up
   - Pair consecutive hashes: (h₀, h₁), (h₂, h₃), ...
   - If odd count: duplicate last hash
   - Parent hash = SHA-256(left || right)
   - Repeat until single root

**Example**:
```
Files: [a.json, b.json, c.json]
Hashes: [h_a, h_b, h_c]

Level 0: [h_a, h_b, h_c, h_c]  (duplicate h_c for even count)
Level 1: [H(h_a || h_b), H(h_c || h_c)]
Level 2: [H(H(h_a || h_b) || H(h_c || h_c))]  ← Merkle root
```

### R6: Chain Continuity
Each digest MUST reference the previous digest's root:
- Field: `prev_root` (string | null)
- Value: Previous `merkle_root` from last digest
- First digest: `prev_root = null`

Storage: `.logs/mcp/digest_chain.json`
```json
{
  "current_root": "abc123...",
  "previous_root": "def456...",
  "updated_at": 1737567890123
}
```

### R7: Timestamp Stability
Digest computation MUST NOT include:
- Current timestamp (use fixed timestamp from chain file)
- System locale
- Timezone-dependent values

All timestamps in output MUST be:
- UTC timezone
- ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

## Digest Output Format

File: `proof/proof_digest_v1.json`

```json
{
  "version": "1.0",
  "spec": "digest_spec_v1",
  "computed_at": "2025-01-22T18:00:00.000Z",
  "merkle_root": "a1b2c3d4...",
  "prev_root": "e5f6g7h8..." | null,
  "file_count": 5,
  "algorithm": "sha256",
  "tree": [
    {
      "file": "proof/log_privacy_v1.json",
      "hash": "...",
      "size": 1234
    },
    ...
  ],
  "signature": {
    "method": "RFC-digest_spec_v1",
    "attestation": "Deterministic digest of 5 proof files",
    "verifiable_by": "Tower /api/tower/verifyDigest"
  }
}
```

## Implementation Algorithm

### Pseudocode

```python
def compute_digest(proof_dir: str) -> dict:
    # 1. Discover proof files
    files = glob(f"{proof_dir}/**/*.json")
    files = [f for f in files if not is_excluded(f)]
    files = sorted(files)  # Lexicographic order

    # 2. Compute leaf hashes
    leaves = []
    for file in files:
        content = read_file(file)
        canonical = canonicalize_json(content)
        hash = sha256(canonical.encode('utf-8')).hexdigest()
        leaves.append({
            "file": relative_path(file),
            "hash": hash,
            "size": len(canonical)
        })

    # 3. Build Merkle tree
    merkle_root = build_merkle_tree([leaf["hash"] for leaf in leaves])

    # 4. Load previous root
    chain = load_chain_file()
    prev_root = chain.get("current_root") if chain else None

    # 5. Construct digest
    digest = {
        "version": "1.0",
        "spec": "digest_spec_v1",
        "computed_at": now_utc_iso(),
        "merkle_root": merkle_root,
        "prev_root": prev_root,
        "file_count": len(leaves),
        "algorithm": "sha256",
        "tree": leaves,
        "signature": {
            "method": "RFC-digest_spec_v1",
            "attestation": f"Deterministic digest of {len(leaves)} proof files",
            "verifiable_by": "Tower /api/tower/verifyDigest"
        }
    }

    # 6. Update chain
    save_chain_file({
        "current_root": merkle_root,
        "previous_root": prev_root,
        "updated_at": now_timestamp_ms()
    })

    return digest

def canonicalize_json(json_str: str) -> str:
    obj = json.loads(json_str)
    return json.dumps(obj, sort_keys=True, indent=2, ensure_ascii=False) + "\n"

def build_merkle_tree(hashes: list[str]) -> str:
    if len(hashes) == 0:
        return sha256(b"").hexdigest()
    if len(hashes) == 1:
        return hashes[0]

    # Pad to even count
    if len(hashes) % 2 == 1:
        hashes.append(hashes[-1])

    # Build parent level
    parents = []
    for i in range(0, len(hashes), 2):
        left = hashes[i]
        right = hashes[i + 1]
        parent = sha256((left + right).encode('utf-8')).hexdigest()
        parents.append(parent)

    return build_merkle_tree(parents)
```

## Verification Protocol

### Local Verification
```bash
# Regenerate digest twice
npm run digest:generate
mv proof/proof_digest_v1.json proof/digest1.json

npm run digest:generate
mv proof/proof_digest_v1.json proof/digest2.json

# Compare byte-for-byte (excluding computed_at)
diff <(jq 'del(.computed_at)' proof/digest1.json) \
     <(jq 'del(.computed_at)' proof/digest2.json)
# Exit code 0 = identical
```

### Tower Verification
```bash
# POST digest to Tower
curl -X POST https://tower.qontrek.com/api/tower/verifyDigest \
  -H "Content-Type: application/json" \
  -H "X-Atlas-Key: $ATLAS_KEY" \
  -d @proof/proof_digest_v1.json

# Expected response: 200 OK
{
  "verified": true,
  "merkle_root": "a1b2c3d4...",
  "message": "Digest verified against known proof chain"
}
```

## Security Considerations

### S1: Hash Collision Resistance
SHA-256 provides 128-bit collision resistance, sufficient for proof artifacts (expected count < 10⁶).

### S2: Preimage Attacks
Attackers cannot craft proof files to produce a target Merkle root without breaking SHA-256.

### S3: Chain Manipulation
`prev_root` chaining prevents:
- **Insertion**: Cannot insert historical digest without breaking chain
- **Deletion**: Missing link detected by discontinuous prev_root
- **Reordering**: Chronological order enforced by append-only chain

### S4: Reproducibility Attacks
An attacker who controls proof files can produce valid digests, but:
- All proof files are version-controlled (Git)
- Tower maintains independent proof registry
- Divergence detected by Tower verification

## Versioning

This specification follows semantic versioning:
- **Major**: Breaking changes to digest format or algorithm
- **Minor**: Backward-compatible additions (e.g., new metadata fields)
- **Patch**: Clarifications, typo fixes (no format changes)

Current version: **1.0.0**

## References

- [RFC 6962](https://tools.ietf.org/html/rfc6962): Certificate Transparency (Merkle tree construction)
- [NIST FIPS 180-4](https://csrc.nist.gov/publications/detail/fips/180/4/final): SHA-256 specification
- [RFC 8785](https://tools.ietf.org/html/rfc8785): JSON Canonicalization Scheme (JCS)

## Changelog

### 1.0.0 (2025-01-22)
- Initial specification
- Canonical JSON with sorted keys, LF newlines
- Deterministic Merkle tree construction
- Chain continuity with prev_root
- Excluded patterns for digest files and OS metadata
