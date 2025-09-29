<<<<<<< HEAD
# Qontrek Agents Runtime

The Qontrek Agents Runtime powers Qontrek's multi-tenant agent workflows across messaging channels. It bundles persona prompts, Supabase-backed logging utilities, and Codex/n8n automation scripts that can serve many brands from a single deployment. Voltek and Perodua are the current example tenants that ship with this repository.

## Multi-Tenant Design
- Each tenant (brand) receives its own configuration row in the Supabase `brand_config` table, capturing the WhatsApp `phone_number_id`, API tokens, locale, and unit pricing used when metering credit consumption.
- Idempotency keys, credit usage logs, and delivery audit trails are always stamped with the active brand so concurrent tenant traffic stays isolated.
- Flows and persona prompts are shared assets: the runtime loads tenant-aware overrides (config, persona selection, pricing) before executing a flow, while Supabase and n8n integrations read the tenant metadata to route notifications to the correct channels.

## Example Tenants
- **Voltek** – Solar lead engagement nurtures prospects via WhatsApp/Slack and logs outcomes in Supabase using the Voltek tenant configuration.
- **Perodua** – Automotive sales follow-ups reuse the same runtime while injecting Perodua-specific personas, pricing, and channel tokens.

## Prerequisites
- **Supabase project** with the `brand_config`, `yaml_trigger_log`, and related tables plus API credentials exposed as environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (used by `agent_runner.py` for writes)
  - `SUPABASE_API_KEY` (used by batch upload scripts)
- **Python 3.10+** and the Python dependencies pinned in `requirements.txt`.
- **(Optional) n8n workflows** wired to your WhatsApp provider (e.g., WhatChimp) if you plan to trigger live sends instead of running in `DRY_RUN` mode. n8n nodes should read the tenant metadata supplied by the runtime to select the proper WhatsApp credential set.
- **(Optional) Slack Incoming Webhook** for the runtime's Slack notifications, scoped per tenant workspace if needed.

## Repository structure
- `agents/` – Persona-specific prompt snippets and dossiers for human handoff or QA.
- `agent_runner.py` – Main runtime entry point that enforces idempotency, evaluates guards, logs to Supabase, and triggers WhatsApp/Slack actions.
- `agent_logger.py`, `agent_summary.py`, `roi_calc.py`, `retriever_router.py` – Reusable runtime modules for logging, summarising agent runs, ROI calculations, and persona routing.
- `config/` – YAML/JSON configuration for credentials, persona routing, plan tiers, and pricing.
- `flows/` – YAML blueprints describing guardrails and delivery actions for each automation flow.
- `retriever/` – Agent selection helpers plus utilities for broadcasting explainer cards or fallbacks.
- `scripts/` – Operational scripts that convert CSV catalogues to YAML, push recipes to Supabase, and log fallback/task outcomes.
- `batch/` and `taskmeta/` – Codex CLI recipes and metadata describing multi-step automation batches (CSV → YAML → Supabase → logging).
- `tests/` – Pytest suite (currently `test_agent_runner.py`) covering guardrails and runtime behaviours.

## Setup
1. **Clone the repository** and create a virtual environment:
   ```bash
   git clone https://github.com/voltekai/voltek-prompts.git
   cd voltek-prompts
   python -m venv .venv
   source .venv/bin/activate
   ```
2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure environment variables** (recommended via `.env` loaded by `python-dotenv`):
   ```bash
   cp .env.example .env  # create if your team provides a template
   # Populate with values such as:
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_KEY="service-role-key"
   SUPABASE_API_KEY="anon-or-service-key"
   SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."  # optional
   DRY_RUN=1  # keep 1 until WhatsApp is wired
   BRAND=voltek  # optional: local testing only; production tenants live in brand_config
   ```
   Export the same variables in your shell if you are not using `.env`. In production, rely on the Supabase `brand_config` table instead of `.env` overrides so the runtime can load credentials and unit prices dynamically per tenant.

## Runtime quick start
1. **Ensure Supabase credentials are loaded** so the runtime can upsert into `yaml_trigger_log` with the correct tenant metadata.
2. **Run the survey pending alert demo** using the default Voltek tenant setup:
   ```bash
   python agent_runner.py --flow survey_pending_alert --tenant-id demo-tenant
   ```
   The current CLI ignores the `--flow` / `--tenant-id` flags but still executes the embedded demo lead with Voltek defaults. You should see console output showing:
   - The first run firing `survey_pending_alert` and logging `sent` to Supabase.
   - A second call being skipped because the idempotency guard detects a recent send.
   - A `formb_helper` run demonstrating guard evaluation.
   With `DRY_RUN=1`, WhatsApp/Slack actions are stubbed, so no live messages are dispatched. When you disable `DRY_RUN`, ensure WhatChimp/n8n credentials are configured for the active tenant.

## Batch pipeline quick start (CSV → YAML → Supabase)
1. Prepare an n8n workflow catalogue CSV such as `n8n_workflow_catalog_full.csv`.
2. Convert the CSV into YAML recipes:
   ```bash
   python scripts/csv_to_yaml.py n8n_workflow_catalog_full.csv resipi/clinic/
   ```
3. Upload the generated YAML files to Supabase:
   ```bash
   python scripts/resipi_loader.py resipi/clinic/
   ```
4. Automate the full pipeline (optional) with the Codex batch script:
   ```bash
   bash batch/codex_loader_sync.batch
   ```
   The batch orchestrates conversion, upload, fallback logging, and task status logging in one go. Ensure the referenced CSV and `resipi/clinic/` directory exist before running.

## Testing
Run the pytest suite after making changes:
```bash
pytest
```
This currently executes `test_agent_runner.py`, which validates template guards and qualifier scoring logic.

## Next steps
- Populate `resipi/` and `agent_profiles/` assets or update scripts to degrade gracefully when data is missing.
- Expand the README with additional flows, deployment playbooks, or a Supabase schema reference as the project matures.
=======
# Qontrek Engine

Core runtime & agent configs powering **SME AutoBiz OS**.  
This repo hosts the engine (agents, retrievers, configs, scripts) and links to runbook flows via a submodule.

---

## 📂 Structure

- `agents/` → AI agent prompt configs
- `config/` → matrices & pricing maps
- `scripts/` → runtime tools (loggers, loaders, etc.)
- `flows/` → **submodule** pointing to [qontrek-flows](https://github.com/fidos777/qontrek-flows)

---

## 🚀 Getting Started

### Clone with submodules
```bash
git clone --recurse-submodules git@github.com:fidos777/qontrek-engine.git
cd qontrek-engine

>>>>>>> main
