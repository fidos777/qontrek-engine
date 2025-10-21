#!/usr/bin/env python3
"""
Autonomy corrective engine blueprint.
Evaluates drift reports and orchestrates corrective actions or escalations.
"""
import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, Optional


DEFAULT_REPORT = Path("proof/autonomy/drift_report.json")
DEFAULT_SCORE = Path("proof/autonomy/drift_score.json")
DEFAULT_POLICY_DIFF = Path("proof/policy_diff.json")
DEFAULT_OUT = Path("proof/autonomy/corrective_action.json")


@dataclass
class CorrectiveDecision:
  severity: float
  classification: str
  policy_diff: Optional[str]
  action: str
  notes: str

  def to_dict(self) -> Dict[str, Any]:
    return {
      "severity": self.severity,
      "classification": self.classification,
      "policy_diff": self.policy_diff,
      "action": self.action,
      "notes": self.notes,
    }


def load_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    return {}
  return json.loads(path.read_text())


def decide(score: Dict[str, Any], report: Dict[str, Any], policy_diff: Dict[str, Any]) -> CorrectiveDecision:
  severity = float(score.get("severity") or 0.0)
  classification = score.get("classification") or "normal"
  policy_class = policy_diff.get("class")

  if policy_class == "material":
    return CorrectiveDecision(
      severity=severity,
      classification=classification,
      policy_diff=policy_class,
      action="escalate",
      notes="Material policy change detected; manual review required.",
    )

  if severity >= 0.8:
    return CorrectiveDecision(
      severity=severity,
      classification=classification,
      policy_diff=policy_class,
      action="escalate",
      notes="Critical drift severity; handoff to governance duty officer.",
    )

  if severity >= 0.4:
    return CorrectiveDecision(
      severity=severity,
      classification=classification,
      policy_diff=policy_class,
      action="corrective_playbook",
      notes="Elevated drift detected; trigger corrective playbook.",
    )

  if severity >= 0.2:
    return CorrectiveDecision(
      severity=severity,
      classification=classification,
      policy_diff=policy_class,
      action="observe",
      notes="Warning level drift; increase observation cadence.",
    )

  return CorrectiveDecision(
    severity=severity,
    classification=classification,
    policy_diff=policy_class,
    action="noop",
    notes="No corrective action required.",
  )


def main(argv=None) -> None:
  parser = argparse.ArgumentParser(description="Autonomy corrective engine.")
  parser.add_argument("--report", type=Path, default=DEFAULT_REPORT, help="Drift report path.")
  parser.add_argument("--score", type=Path, default=DEFAULT_SCORE, help="Drift score path.")
  parser.add_argument(
    "--policy-diff",
    type=Path,
    default=DEFAULT_POLICY_DIFF,
    help="Policy diff classification path.",
  )
  parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output path for corrective decision.")
  args = parser.parse_args(argv)

  report = load_json(args.report)
  score = load_json(args.score)
  policy_diff = load_json(args.policy_diff)

  decision = decide(score, report, policy_diff)
  payload = {
    "phase": "autonomy",
    "generated_at": score.get("generated_at") or report.get("generated_at"),
    "inputs": {
      "score": str(args.score),
      "report": str(args.report),
      "policy_diff": str(args.policy_diff),
    },
    "decision": decision.to_dict(),
  }
  args.out.parent.mkdir(parents=True, exist_ok=True)
  args.out.write_text(json.dumps(payload, indent=2))
  print(
    f"Autonomy corrective decision → {payload['decision']['action']} "
    f"(severity={payload['decision']['severity']})"
  )


if __name__ == "__main__":
  main()
