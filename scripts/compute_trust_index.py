#!/usr/bin/env python3
import json, sys
from pathlib import Path

VERIFY = Path("proof/cloud_sync_verify.json")
OUT    = Path("proof/cloud_sync_verify.json")  # in-place update

doc = json.loads(VERIFY.read_text())
c = doc.get("counters", {})
den = (c.get("verified_ok",0) + c.get("verified_mismatch",0)
       + c.get("verified_missing_sha",0))
trust = (100.0 * c.get("verified_ok",0) / den) if den else 0.0
doc["trust_index"] = round(trust, 2)
OUT.write_text(json.dumps(doc, indent=2))
print(f"trust_index={doc['trust_index']}%")

