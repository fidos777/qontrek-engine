#!/usr/bin/env python3
"""
Placeholder script to emit change receipt entries for backfill/repair operations.
"""
import argparse
import json
import time
import uuid
from pathlib import Path
from typing import Any, Dict


RECEIPT_INDEX = Path("proof/change_receipt_index.json")


def load_index() -> Dict[str, Any]:
  if RECEIPT_INDEX.exists():
    try:
      return json.loads(RECEIPT_INDEX.read_text())
    except json.JSONDecodeError:
      pass
  return {"receipts": []}


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Record a change receipt for repair/backfill.")
  parser.add_argument("--summary", default="Repair/backfill executed", help="Receipt summary.")
  parser.add_argument("--change-type", default="repair", help="Type of change.")
  parser.add_argument("--diff-hash", default="pending", help="Hash of associated diff/proof.")
  parser.add_argument("--receipt-id", default=None, help="Optional explicit receipt id.")
  args = parser.parse_args(argv)

  receipt_id = args.receipt_id or f"CR-{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
  issued_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

  index = load_index()
  index.setdefault("receipts", [])
  index["receipts"].append(
    {
      "receipt_id": receipt_id,
      "issued_at": issued_at,
      "change_type": args.change_type,
      "summary": args.summary,
      "diff_hash": args.diff_hash,
    }
  )
  index["last_receipt_id"] = receipt_id
  index["autotune_guard_active"] = index.get("autotune_guard_active", True)

  RECEIPT_INDEX.parent.mkdir(parents=True, exist_ok=True)
  RECEIPT_INDEX.write_text(json.dumps(index, indent=2))
  print(f"✅ Recorded change receipt {receipt_id}")


if __name__ == "__main__":
  main()
