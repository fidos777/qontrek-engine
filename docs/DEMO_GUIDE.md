# WhatsApp Runtime Demo Guide

This guide walks a new teammate through validating the Qontrek WhatsApp runtime end-to-end. Follow the steps below in order—the entire walkthrough should take less than 30 minutes once the prerequisites from the README are satisfied.

## Step 1 — Run environment preflight (expect ✅)
1. Ensure your Supabase service key and URL are exported (or stored in `.env`).
2. Execute the preflight script via the Makefile:
   ```bash
   make preflight
   ```
3. A successful run prints ✅ messages for environment variables, table checks, unique indexes, and `vw_unmetered_24h`. Investigate any ❌ output before continuing.

## Step 2 — Preview Flow B (Send+Meter) for Voltek & Perodua
1. With the same shell session, trigger the Flow B preview for both tenants:
   ```bash
   make run-demo
   ```
2. The command invokes `agent_runner.py --flow flows/send_and_meter.yaml` twice—once with `--brand Voltek` and once with `--brand Perodua`—so you can inspect the metadata that powers the multi-tenant send-and-meter pipeline before wiring it into n8n.
3. Review the console output for the flow name, brand context, and description to confirm you’re pointing at the expected YAML asset. Live sends remain disabled (dry-run) in this preview; n8n handles real execution once credentials are applied.

## Step 3 — Import Metabase SQL (3 tiles)
1. Open Metabase → **Browse Data → Native query** and paste the three KPI statements from `dashboards/sql/`:
   - `sent_vs_metered.sql`
   - `acceptance.sql`
   - `template_ranking.sql`
2. Save each as a card inside your WhatsApp monitoring dashboard. The queries include an optional `{{brand}}` filter so teams can scope visuals to an individual tenant or leave them global.
3. (Optional) Add `unmetered_watch.sql` as a table card to surface the raw rows behind the unmetered KPI.

## Step 4 — Load n8n flow stubs
1. In n8n, import the JSON exports located under `flows/`:
   - `inlet.json`
   - `roi_nudge.json`
   - `monitor.json`
   - `referral.json`
   - (Optional) `send_meter.json` if you want to inspect the shared Flow B logic.
2. Wire the Postgres credentials to your Supabase project and the Slack credential to your alerts channel.
3. Keep the flows disabled until you are ready to connect production webhooks—these exports are meant as stubs for local validation.

## Step 5 — Negative test (invalid template → reversed)
1. In n8n or via a manual Supabase insert, trigger Flow B with an intentionally invalid WhatsApp template name (e.g., typo or unpublished template).
2. Observe the `wa_template_log` entry flip to `status='reversed'` with a descriptive `reversal_reason`, and confirm no `credit_logs` row appears for the same idempotency key.
3. Capture Slack alert screenshots for both the unmetered and acceptance warnings once they are wired:
   - _Placeholder: add `images/slack-unmetered.png`_
   - _Placeholder: add `images/slack-acceptance.png`_

> Tip: Re-run `make preflight` after schema migrations or tenant onboarding to ensure guardrails stay intact.
