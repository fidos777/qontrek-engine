#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from typing import Dict, Any, Iterable, Set


def classify_diff(before: Dict[str, Any], after: Dict[str, Any]) -> str:
  before_keys = set(before.keys())
  after_keys = set(after.keys())
  all_keys: Set[str] = before_keys.union(after_keys)

  diff_keys = [key for key in all_keys if before.get(key) != after.get(key)]
  if not diff_keys:
    return "none"

  material_markers = ("threshold", "rule", "policy", "limit")
  material = any(any(marker in key for marker in material_markers) for key in diff_keys)
  return "material" if material else "cosmetic"


def load_map(path: Path) -> Dict[str, Any]:
  if not path.exists():
    raise SystemExit(f"Missing governance map: {path}")
  return json.loads(path.read_text())


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Classify governance policy diffs.")
  parser.add_argument(
    "--previous",
    default="reflex_governance_map_prev.json",
    type=Path,
    help="Previous governance map path.",
  )
  parser.add_argument(
    "--current",
    default="reflex_governance_map.json",
    type=Path,
    help="Current governance map path.",
  )
  parser.add_argument(
    "--out",
    default="proof/policy_diff.json",
    type=Path,
    help="Output path for diff classification.",
  )
  args = parser.parse_args(argv)

  before = load_map(args.previous)
  after = load_map(args.current)
  classification = classify_diff(before, after)

  payload = {
    "phase": "tower_sync",
    "previous": str(args.previous),
    "current": str(args.current),
    "class": classification,
  }
  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(payload, indent=2))
  print(f"policy_diff_class={classification}")


if __name__ == "__main__":
  main()
