# WhatsApp Runtime Demo Guide

This guide walks a new teammate through validating the Qontrek WhatsApp runtime end-to-end. Follow the steps below in order—the entire walkthrough should take less than 30 minutes once the prerequisites from the README are satisfied.

## Step 1 — Run environment preflight (expect ✅)
1. Ensure your Supabase service key and URL are exported (or stored in `.env`).
2. Execute the preflight script via the Makefile:
   ```bash
   make preflight
   ```
3. A successful run prints ✅ messages for environment variables, table checks, unique indexes, and `vw_unmetered_24h`. Investigate any ❌ output before continuing.

## Step 2 — Execute the runtime demo (Voltek & Perodua)
1. With the same shell session, trigger the baked-in runtime demo for both tenants:
   ```bash
   make run-demo
   ```
2. The command runs `agent_runner.py` twice—once with `BRAND=Voltek` and once with `BRAND=Perodua`—so you can see the sample survey alert logic execute in each context. The script reuses the same mock lead but the Supabase logs will be brand-scoped when live credentials are present.
3. Expect to see console output showing the first survey alert firing, the second being skipped because of idempotency, and the Form B helper guard evaluation.

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
