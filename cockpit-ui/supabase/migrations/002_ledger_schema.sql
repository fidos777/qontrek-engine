-- ============================================
-- L9 LEDGER TABLES
-- Purpose: Immutable audit trail for Tower verification
-- Run AFTER 001_solar_schema.sql
-- ============================================

-- ============================================
-- LEDGER ENTRIES TABLE
-- Core audit log - append-only, never delete
-- ============================================

CREATE TABLE IF NOT EXISTS ledger_entries (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
  
  -- Temporal
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  sequence_no BIGINT NOT NULL,
  
  -- Context
  tenant_id TEXT NOT NULL,
  vertical TEXT NOT NULL,
  workflow_id UUID,
  job_id UUID,
  step_id TEXT,
  
  -- Actor (who performed the action)
  actor_type TEXT NOT NULL CHECK (actor_type IN ('USER', 'SYSTEM', 'WORKFLOW', 'API', 'TOWER')),
  actor_id TEXT NOT NULL,
  actor_name TEXT,
  actor_ip TEXT,
  
  -- Subject (what was affected)
  subject_type TEXT CHECK (subject_type IN ('FILE', 'RECORD', 'BATCH', 'WORKFLOW', 'PROOF', 'QUERY')),
  subject_id TEXT,
  subject_name TEXT,
  subject_table TEXT,
  
  -- Payload (operation-specific data)
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Integrity (blockchain-style)
  checksum TEXT NOT NULL, -- SHA-256 of payload
  previous_hash TEXT NOT NULL, -- Hash linking to previous entry
  
  -- Governance gates affected
  gates_affected TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_vertical 
  ON ledger_entries(tenant_id, vertical);

CREATE INDEX IF NOT EXISTS idx_ledger_workflow 
  ON ledger_entries(workflow_id) WHERE workflow_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_job 
  ON ledger_entries(job_id) WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_timestamp 
  ON ledger_entries(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entry_type 
  ON ledger_entries(entry_type);

CREATE INDEX IF NOT EXISTS idx_ledger_actor 
  ON ledger_entries(actor_type, actor_id);

CREATE INDEX IF NOT EXISTS idx_ledger_subject 
  ON ledger_entries(subject_type, subject_id) WHERE subject_id IS NOT NULL;

-- Sequence number must be unique per tenant/vertical
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_sequence 
  ON ledger_entries(tenant_id, vertical, sequence_no);

-- ============================================
-- PROOF DIGESTS TABLE
-- Summarized proofs sent to Tower
-- ============================================

CREATE TABLE IF NOT EXISTS proof_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  job_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  tenant_id TEXT NOT NULL,
  vertical TEXT NOT NULL,
  
  -- Temporal
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  
  -- Digest
  entry_count INTEGER NOT NULL,
  first_sequence BIGINT NOT NULL,
  last_sequence BIGINT NOT NULL,
  merkle_root TEXT NOT NULL,
  chain_valid BOOLEAN NOT NULL DEFAULT true,
  
  -- Summary
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  warnings INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  
  -- Tower acknowledgment
  tower_ack_id TEXT,
  tower_ack_at TIMESTAMPTZ,
  tower_latency_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proof_digests_job 
  ON proof_digests(job_id);

CREATE INDEX IF NOT EXISTS idx_proof_digests_tenant 
  ON proof_digests(tenant_id, vertical);

CREATE INDEX IF NOT EXISTS idx_proof_digests_merkle 
  ON proof_digests(merkle_root);

-- ============================================
-- INGESTION JOBS TABLE
-- Track upload/processing jobs
-- ============================================

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Workflow reference
  workflow_id TEXT NOT NULL,
  workflow_version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Context
  tenant_id TEXT NOT NULL,
  vertical TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  current_step TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Input
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_by_name TEXT,
  
  -- Output
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  total_pipeline_value DECIMAL(15,2) DEFAULT 0,
  
  -- Errors
  error_message TEXT,
  error_details JSONB,
  
  -- Proof
  proof_digest_id UUID REFERENCES proof_digests(id),
  
  -- Temporal
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_tenant 
  ON ingestion_jobs(tenant_id, vertical);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status 
  ON ingestion_jobs(status);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_uploaded_by 
  ON ingestion_jobs(uploaded_by);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Ledger entries: Append-only, read by tenant
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant ledger entries"
  ON ledger_entries FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

-- No UPDATE or DELETE policies - ledger is immutable
CREATE POLICY "System can insert ledger entries"
  ON ledger_entries FOR INSERT
  WITH CHECK (true); -- Controlled by service role

-- Proof digests: Read by tenant, insert by system
ALTER TABLE proof_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant proof digests"
  ON proof_digests FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "System can insert proof digests"
  ON proof_digests FOR INSERT
  WITH CHECK (true);

-- Ingestion jobs: Full access by tenant
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant jobs"
  ON ingestion_jobs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can insert own tenant jobs"
  ON ingestion_jobs FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Users can update own tenant jobs"
  ON ingestion_jobs FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next sequence number
CREATE OR REPLACE FUNCTION get_next_ledger_sequence(
  p_tenant_id TEXT,
  p_vertical TEXT
) RETURNS BIGINT AS $$
DECLARE
  v_next BIGINT;
BEGIN
  SELECT COALESCE(MAX(sequence_no), 0) + 1
  INTO v_next
  FROM ledger_entries
  WHERE tenant_id = p_tenant_id AND vertical = p_vertical;
  
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Function to verify chain integrity
CREATE OR REPLACE FUNCTION verify_ledger_chain(
  p_tenant_id TEXT,
  p_vertical TEXT,
  p_from_sequence BIGINT DEFAULT 1,
  p_to_sequence BIGINT DEFAULT NULL
) RETURNS TABLE (
  valid BOOLEAN,
  entries_checked INTEGER,
  first_invalid_sequence BIGINT,
  error_message TEXT
) AS $$
DECLARE
  v_entry RECORD;
  v_previous_hash TEXT := REPEAT('0', 64);
  v_count INTEGER := 0;
BEGIN
  FOR v_entry IN 
    SELECT sequence_no, checksum, previous_hash
    FROM ledger_entries
    WHERE tenant_id = p_tenant_id 
      AND vertical = p_vertical
      AND sequence_no >= p_from_sequence
      AND (p_to_sequence IS NULL OR sequence_no <= p_to_sequence)
    ORDER BY sequence_no
  LOOP
    v_count := v_count + 1;
    
    IF v_entry.previous_hash != v_previous_hash THEN
      RETURN QUERY SELECT 
        false, 
        v_count, 
        v_entry.sequence_no,
        'Previous hash mismatch at sequence ' || v_entry.sequence_no;
      RETURN;
    END IF;
    
    -- In production: recalculate and verify checksum
    v_previous_hash := encode(
      sha256(
        (v_entry.sequence_no || v_entry.checksum || v_previous_hash)::bytea
      ),
      'hex'
    );
  END LOOP;
  
  RETURN QUERY SELECT true, v_count, NULL::BIGINT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get job summary from ledger
CREATE OR REPLACE FUNCTION get_job_ledger_summary(
  p_job_id UUID
) RETURNS TABLE (
  total_entries INTEGER,
  entry_types JSONB,
  gates_affected TEXT[],
  has_errors BOOLEAN,
  first_entry TIMESTAMPTZ,
  last_entry TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_entries,
    jsonb_object_agg(entry_type, type_count) as entry_types,
    array_agg(DISTINCT unnest_gate) FILTER (WHERE unnest_gate IS NOT NULL) as gates_affected,
    bool_or(severity IN ('ERROR', 'CRITICAL')) as has_errors,
    MIN(timestamp) as first_entry,
    MAX(timestamp) as last_entry
  FROM (
    SELECT 
      entry_type,
      severity,
      timestamp,
      COUNT(*) OVER (PARTITION BY entry_type) as type_count,
      unnest(gates_affected) as unnest_gate
    FROM ledger_entries
    WHERE job_id = p_job_id
  ) sub;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ingestion_jobs_updated_at
  BEFORE UPDATE ON ingestion_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- View: Recent ledger activity
CREATE OR REPLACE VIEW v_recent_ledger_activity AS
SELECT 
  le.id,
  le.entry_type,
  le.severity,
  le.timestamp,
  le.tenant_id,
  le.vertical,
  le.actor_type,
  le.actor_name,
  le.subject_type,
  le.subject_name,
  le.gates_affected,
  ij.file_name,
  ij.status as job_status
FROM ledger_entries le
LEFT JOIN ingestion_jobs ij ON le.job_id = ij.id
ORDER BY le.timestamp DESC;

-- View: Proof digest summary
CREATE OR REPLACE VIEW v_proof_digest_summary AS
SELECT 
  pd.*,
  ij.file_name,
  ij.uploaded_by_name,
  CASE 
    WHEN pd.tower_ack_id IS NOT NULL THEN 'acknowledged'
    WHEN pd.chain_valid = false THEN 'invalid'
    ELSE 'pending'
  END as verification_status
FROM proof_digests pd
JOIN ingestion_jobs ij ON pd.job_id = ij.id
ORDER BY pd.created_at DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ledger_entries IS 'L9 Ledger: Immutable audit trail for all data operations. Never delete rows.';
COMMENT ON TABLE proof_digests IS 'Summarized proof digests sent to Tower Federation for verification.';
COMMENT ON TABLE ingestion_jobs IS 'Tracks Excel upload and processing jobs.';
COMMENT ON COLUMN ledger_entries.checksum IS 'SHA-256 hash of payload for integrity verification.';
COMMENT ON COLUMN ledger_entries.previous_hash IS 'Hash linking to previous entry, forming a chain.';
COMMENT ON COLUMN ledger_entries.gates_affected IS 'Governance gates (G13-G21) affected by this operation.';
