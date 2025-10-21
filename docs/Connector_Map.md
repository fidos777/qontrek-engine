# 🗺️ QONTREK CONTROL TOWER — CONNECTOR MAP (v10.6.1)

## 🧭 1️⃣ OVERVIEW

| Tower Layer | Repo Name | Role / Purpose | Connector Use | Connection Status |
|--------------|------------|----------------|----------------|------------------|
| **C1 – Codex (Proof Factory)** | `fidos777/qontrek-engine` | Pytest + proof assertions (flows/ops/RLS invariants) live with runtime | ✓ ChatGPT audits tests & schema effects pre-runtime | ✅ Connected |
| **C2 – DevOps (Runtime Factory)** | `fidos777/qontrek-engine` | Core runtime & AgentKit adapter; migrations, dashboards SQL, scripts | ✓ ChatGPT monitors runtime commits + migrations | ✅ Connected |
| **C3 – Cockpit (Visibility Factory)** | `fidos777/qontrek-site` | Next.js frontend (Cockpit UI + G7 tiles + Compliance panel) | ✓ Verify UI binds to metrics | ⚪ Connect Later |
| **C4 – Ledger (Truth Factory)** | `fidos777/qontrek-flows` | Flow specs (JSON/YAML) + helpers; mounted under `engine/flows` (submodule) | ✓ Review flow logic, SQL usage, naming | ⚪ Connect After C2 Stable |
| **C5 – Mission Auditor (Governance)** | _ChatGPT GitHub Connector_ | Passive QA across C1–C4; mission alignment + audit trail | ✓ Auto-included | ✅ Connected |

---

## 🛰️ 2️⃣ C5 – MISSION AUDITOR (ChatGPT GitHub Connector)

**Role:** Passive QA Officer across C1–C4.  
**Functions:**
- Verify schema parity (pytest vs runtime migrations & dashboards)
- Validate `mission_v11.yaml` references (existence + alignment)
- Generate `docs/Tower_Audit_Log.md` daily
- Summarize proof status for G7 readiness  

**Rule:** No automation or deploy actions — observation & reporting only.

---

## ⚙️ 3️⃣ CONNECTOR ROLES (embedded in `mission_v11.yaml`)

```yaml
agents:
  - name: chatgpt_connector
    role: Mission Auditor (C5)
    repositories:
      - fidos777/qontrek-engine      # C1 + C2
      - fidos777/qontrek-flows       # C4 (submodule mounted at engine/flows)
      - fidos777/qontrek-site        # C3 (only when UI work active)
    triggers:
      - on_pull_request:
          - "migrations/*.sql"
          - "dashboards/sql/*.sql"
          - "tests/**/*.py"
          - "agents/**/*"
          - "scripts/**/*"
          - "flows/**"
    actions:
      - review_code: true
      - verify_manifest: true
      - summarize_proof_status: true

