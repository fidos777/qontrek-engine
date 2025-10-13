# Vercel Repo Governance Guide (Qontrek Tower v10.6.1)

> Purpose: Define which repos deploy to Vercel and which stay runtime-only, to prevent CI errors and maintain Tower discipline (C1–C5 alignment).

---

## 1️⃣ Overview

Qontrek ecosystem terdiri daripada tiga repo utama dan dua governance layers:

| Tower Layer | Repo Name | Function | Deploy Target | Vercel Linked? | Status |
|--------------|------------|-----------|----------------|----------------|---------|
| **C1 – Codex (Proof Factory)** | `fidos777/qontrek-engine` | Logic, tests, YAML → generates manifests & telemetry bridge | — | ❌ No | Runtime only |
| **C2 – DevOps (Runtime Factory)** | `fidos777/qontrek-engine` | Backend runtime + CLI + SQL dashboards | — | ❌ No | Manual deploy only |
| **C3 – Cockpit (Visibility Factory)** | `fidos777/qontrek-site` | Next.js frontend (Gates, CFO Lens, Compliance UI) | ✅ Vercel | ✅ Yes |
| **C4 – Ledger (Truth Factory)** | `fidos777/qontrek-flows` | Supabase views, SQL, JSON flow specs | — | ❌ No | Data only |
| **C5 – Mission Auditor (Governance)** | ChatGPT GitHub Connector | Passive QA layer (no code deployment) | — | ❌ No | Auto-included in Tower |

---

## 2️⃣ ASCII Map — Deployment Responsibility

           ┌──────────────────────────┐
           │   C1: Codex Factory      │  (pytest + YAML)
           └──────────┬───────────────┘
                      │
           ┌──────────▼───────────────┐
           │ C2: Runtime Factory      │  (FastAPI + telemetry bridge)
           └──────────┬───────────────┘
                      │
           │──────────▼───────────────┐
           │ C3: Cockpit (Next.js)    │  →  🌐 Vercel Deploy
           └──────────┬───────────────┘
                      │
           ┌──────────▼───────────────┐
           │ C4: Ledger (SQL/Flows)   │  →  🗄️ Supabase (data only)
           └──────────┬───────────────┘
                      │
           ┌──────────▼───────────────┐
           │ C5: Mission Auditor      │  →  🤖 ChatGPT Connector (QA only)
           └──────────────────────────┘

---

## 3️⃣ Deployment Policy

| Repo | Deployment Policy | Notes |
|------|-------------------|--------|
| **qontrek-engine** | Manual only | No build output. CI/CD disabled. Run `pytest`, `make parity`, `make export-agentkit` manually. |
| **qontrek-site** | Auto-deploy (Vercel) | Only UI repo connected to Vercel. Uses Next.js → `vercel --prod`. |
| **qontrek-flows** | Private, not deployable | Acts as data submodule. Supabase sync only. |
| **Legacy voltek-prompts** | Deprecated | Unlink from Vercel. Keep f

To verify local-only runtime (no deploy)pytest -q
make parity
make export-agentkit

To deploy UI (C3 only)cd ~/Documents/qontrek-site
vercel --prod

🏁 Conclusion

C1–C4 = internal proof chain
C3 (Next.js) = public cockpit (Vercel)
C5 (ChatGPT) = governance layer

Together, they form a “Bridge Without Breaking” deployment model —
manual, auditable, and perfectly aligned with OpenAI AgentKit 2025 architecture.
