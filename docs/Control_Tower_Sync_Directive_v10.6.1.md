
---

## 📘 2️⃣ `/docs/Control_Tower_Sync_Directive_v10.6.1.md`

```markdown
# 🗼 CONTROL TOWER SYNC DIRECTIVE — v10.6.1 (Manual Mode → G7)

## 🎯 Purpose
Maintain proof governance during manual-mode development by introducing **C5: Mission Auditor** (ChatGPT GitHub Connector) as a passive QA layer.

## 🧩 Scope
Repos involved: `qontrek-engine` (C1 + C2), `qontrek-flows` (C4, submodule), `qontrek-site` (C3 optional).

## 🧱 Roles
- **C1 – Codex:** proof (pytest), schema/eval parity  
- **C2 – DevOps:** runtime, migrations, dashboards SQL  
- **C3 – Cockpit:** UI tiles + compliance panel  
- **C4 – Ledger:** flow specs + helpers (submodule)  
- **C5 – Mission Auditor (ChatGPT Connector):** passive QA across C1–C4  

---

## 🧭 C5 RESPONSIBILITIES
1. **Pre-Merge Review:** Summarize PR deltas & verify tests, migrations, dashboards paths, `flows/**` changes.  
2. **Mission Sync:** Cross-check all `mission_v11.yaml` references exist + up-to-date.  
3. **Daily Audit Trail:** Append dated entry to `docs/Tower_Audit_Log.md` for commits tagged `v10.6.1-Bridge`.  
4. **Proof Status:** Output G7 readiness note (passed/missing tests, parity, eval ≥ 0.8).

---

## 🧱 GUARDRAILS
- No deploys — observation & reporting only.  
- One change at a time (PR scope minimal).  
- Submodules must be fetched (recursive checkout).  

---

## 🧰 CONNECTOR PROMPTS (Canonical)

| Routine | Prompt | Output |
|----------|---------|--------|
| PR Audit | `Review PR #<id> for Tower v10.6 criteria (check tests/**/*.py, migrations/*.sql, dashboards/sql/*.sql, flows/**, scripts/**/*).` | Summary + risks + G7 status |
| Mission Sync | `Verify mission_v11.yaml vs repo deliverables and list missing/outdated files.` | Parity report |
| Daily Audit | `Summarize commits tagged v10.6.1-Bridge and append to docs/Tower_Audit_Log.md.` | Markdown entry |
| Proof Status | `Generate G7 readiness note (tests green/yellow/red).` | Readiness summary |

---

## 🧾 EXIT CRITERIA → v11 (AUTOMATION READY)
- 100 % pytest pass for current flows  
- No schema drift between migrations ↔ dashboards ↔ flows  
- `docs/Tower_Audit_Log.md` covers entire v10.6 → G7 cycle

