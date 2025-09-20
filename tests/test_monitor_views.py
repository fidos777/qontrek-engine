from pathlib import Path


def test_rls_policies_scope_brand():
    sql = Path("migrations/001_rls_enable.sql").read_text()
    policies = {
        "events_raw": "events_raw_brand_isolation",
        "wa_template_log": "wa_template_log_brand_isolation",
        "credit_logs": "credit_logs_brand_isolation",
        "referrals": "referrals_brand_isolation",
    }

    for table, policy in policies.items():
        assert f"ALTER TABLE IF EXISTS public.{table} ENABLE ROW LEVEL SECURITY" in sql
        assert f"ALTER TABLE IF EXISTS public.{table} FORCE ROW LEVEL SECURITY" in sql
        assert f"CREATE POLICY {policy}" in sql
        assert "current_setting('app.brand'" in sql


def test_ops_logs_table_and_index_defined():
    sql = Path("migrations/002_ops_logs.sql").read_text()
    assert "CREATE TABLE IF NOT EXISTS public.ops_logs" in sql
    assert "ops_logs_brand_created_at_idx" in sql
    assert "ENABLE ROW LEVEL SECURITY" in sql


def test_unmetered_view_checks_credit_matches():
    view_sql = Path("migrations/003_reconcile_view.sql").read_text()
    assert "CREATE OR REPLACE VIEW public.vw_unmetered_24h" in view_sql
    assert "LEFT JOIN public.credit_logs" in view_sql
    assert "w.status = 'sent'" in view_sql
    assert "c.idempotency_key IS NULL" in view_sql
    assert "INTERVAL '24 hours'" in view_sql


def test_flow_sets_brand_context_before_queries():
    flow_sql = Path("flows/send_meter.json").read_text()
    assert "set_config('app.brand'" in flow_sql


def test_brand_config_seed_includes_sample_tenants():
    sql = Path("migrations/001_brand_config.sql").read_text()
    assert "'Voltek'" in sql
    assert "'Perodua'" in sql
