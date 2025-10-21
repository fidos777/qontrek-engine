#!/usr/bin/env python3
import json
import sys
from pathlib import Path

INDEX_PATH = Path("proof/change_receipt_index.json")


def main() -> int:
  if not INDEX_PATH.exists():
    print("⚠️ change receipt index missing")
    return 0

  try:
    data = json.loads(INDEX_PATH.read_text())
  except json.JSONDecodeError:
    print("❌ change receipt index malformed")
    return 1

  receipts = data.get("receipts", [])
  ids = [receipt.get("receipt_id", "") for receipt in receipts]
  if ids != sorted(ids):
    print("❌ Non-monotonic receipt IDs")
    return 1

  print("✅ Receipts monotonic")
  return 0


if __name__ == "__main__":
  sys.exit(main())
