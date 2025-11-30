-- ============================================
-- QONTREK SOLAR VERTICAL - SUPABASE SCHEMA
-- Version: 1.0.0
-- Based on: MDL_RESIDENTIAL (VOLTEK) Excel Analysis
-- Total Projects: 808 | Total Sales: RM 13.35M | Outstanding: RM 4.17M
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Projects Master Table
CREATE TABLE IF NOT EXISTS solar_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_no VARCHAR(50) UNIQUE NOT NULL,  -- e.g., VESB/RESI/IN/2024/01/0101
    sequence_no INTEGER,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    client_ic VARCHAR(20),
    spouse_ic VARCHAR(20),
    
    -- Location
    address TEXT,
    state VARCHAR(100),
    site_ownership VARCHAR(50),  -- Owner/Tenant
    
    -- Project Details
    project_type VARCHAR(50) DEFAULT 'RESIDENTIAL',  -- RESIDENTIAL, COMMERCIAL, INDUSTRIAL
    month VARCHAR(20),
    quarter VARCHAR(10),  -- Q12024, Q22024, etc.
    event_name VARCHAR(255),
    event_date VARCHAR(100),
    
    -- System Specifications
    proposed_capacity_kwp DECIMAL(10,3),
    proposed_system VARCHAR(50),  -- MICRO, STRING
    finalized_capacity_kwp DECIMAL(10,3),
    finalized_capacity_kwac DECIMAL(10,3),
    system_finalized VARCHAR(50),
    
    -- Status & Workflow
    status VARCHAR(100) NOT NULL,
    status_category VARCHAR(50),  -- Derived: ACTIVE, COMPLETED, CANCELLED, REFUND
    remarks TEXT,
    
    -- Financial
    total_sales DECIMAL(12,2),
    balance DECIMAL(12,2) DEFAULT 0,
    mode_of_payment VARCHAR(100),
    bank_merchant VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Payment Milestones Table
CREATE TABLE IF NOT EXISTS solar_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES solar_projects(id) ON DELETE CASCADE,
    project_no VARCHAR(50) NOT NULL,
    
    -- Payment Stage
    payment_type VARCHAR(20) NOT NULL,  -- BOOKING, 80_PERCENT, 20_PERCENT
    
    -- Payment Details
    amount DECIMAL(12,2),
    payment_date DATE,
    expected_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, RECEIVED, OVERDUE
    days_overdue INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Tracking Table
CREATE TABLE IF NOT EXISTS solar_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES solar_projects(id) ON DELETE CASCADE,
    project_no VARCHAR(50) NOT NULL,
    
    -- Document Type
    doc_type VARCHAR(50) NOT NULL,  -- IC, IC_SPOUSE, TNB_BILL, DECLARATION, PVSVST, PVL, SLD
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SUBMITTED, VERIFIED, MISSING
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEDA Milestones Table
CREATE TABLE IF NOT EXISTS solar_seda_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES solar_projects(id) ON DELETE CASCADE,
    project_no VARCHAR(50) NOT NULL,
    
    -- SEDA Process Dates
    design_completion_date DATE,
    seda_submission_date DATE,
    seda_approval_date DATE,
    seda_cert_date DATE,
    
    -- TNB Process
    tnb_submission_date DATE,
    nem_welcome_letter_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING_DESIGN',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Installation Milestones Table
CREATE TABLE IF NOT EXISTS solar_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES solar_projects(id) ON DELETE CASCADE,
    project_no VARCHAR(50) NOT NULL,
    
    -- Site Visit
    site_visit_date DATE,
    pic_site_visit VARCHAR(255),
    
    -- Installation
    installation_date DATE,
    subcontractor VARCHAR(100),
    site_supervisor VARCHAR(100),
    
    -- Completion
    energize_status VARCHAR(50),
    energize_date DATE,
    handover_status VARCHAR(50),
    handover_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recovery Actions Log (for payment recovery tracking)
CREATE TABLE IF NOT EXISTS solar_recovery_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES solar_projects(id) ON DELETE CASCADE,
    project_no VARCHAR(50) NOT NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL,  -- CALL, SMS, WHATSAPP, EMAIL, SITE_VISIT
    action_date TIMESTAMPTZ DEFAULT NOW(),
    performed_by VARCHAR(100),
    
    -- Result
    result VARCHAR(100),  -- CONNECTED, NO_ANSWER, PROMISED_PAYMENT, SCHEDULED, ESCALATED
    notes TEXT,
    next_action_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_projects_status ON solar_projects(status);
CREATE INDEX idx_projects_status_category ON solar_projects(status_category);
CREATE INDEX idx_projects_quarter ON solar_projects(quarter);
CREATE INDEX idx_projects_state ON solar_projects(state);
CREATE INDEX idx_payments_project ON solar_payments(project_id);
CREATE INDEX idx_payments_status ON solar_payments(status);
CREATE INDEX idx_payments_type ON solar_payments(payment_type);
CREATE INDEX idx_documents_project ON solar_documents(project_id);
CREATE INDEX idx_seda_project ON solar_seda_milestones(project_id);
CREATE INDEX idx_installations_project ON solar_installations(project_id);
CREATE INDEX idx_recovery_project ON solar_recovery_actions(project_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE solar_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_seda_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_recovery_actions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated access (adjust based on your auth setup)
CREATE POLICY "Enable read access for authenticated users" ON solar_projects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON solar_payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON solar_documents
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON solar_seda_milestones
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON solar_installations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON solar_recovery_actions
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- VIEWS FOR DASHBOARD
-- ============================================

-- Payment Recovery Pipeline View
CREATE OR REPLACE VIEW v_payment_recovery_pipeline AS
SELECT 
    p.id,
    p.project_no,
    p.client_name,
    p.client_phone,
    p.status,
    p.status_category,
    p.total_sales,
    p.balance,
    p.state,
    
    -- 80% Payment Info
    pay80.amount AS pending_80_amount,
    pay80.payment_date AS pay_80_date,
    pay80.status AS pay_80_status,
    pay80.days_overdue AS pay_80_days_overdue,
    
    -- 20% Payment Info
    pay20.amount AS pending_20_amount,
    pay20.payment_date AS pay_20_date,
    pay20.status AS pay_20_status,
    pay20.days_overdue AS pay_20_days_overdue,
    
    -- Last Contact
    (SELECT MAX(action_date) FROM solar_recovery_actions WHERE project_id = p.id) AS last_contact,
    (SELECT action_type FROM solar_recovery_actions WHERE project_id = p.id ORDER BY action_date DESC LIMIT 1) AS last_action_type,
    
    -- Recovery Stage
    CASE 
        WHEN p.status ILIKE '%80%' AND p.status ILIKE '%pending%' THEN '80%'
        WHEN p.status ILIKE '%20%' AND p.status ILIKE '%pending%' THEN '20%'
        WHEN p.status ILIKE '%handover%' AND p.status ILIKE '%pending%' THEN 'HANDOVER'
        ELSE 'OTHER'
    END AS recovery_stage
    
FROM solar_projects p
LEFT JOIN solar_payments pay80 ON p.id = pay80.project_id AND pay80.payment_type = '80_PERCENT'
LEFT JOIN solar_payments pay20 ON p.id = pay20.project_id AND pay20.payment_type = '20_PERCENT'
WHERE p.is_deleted = FALSE
    AND p.status_category = 'ACTIVE'
    AND p.balance > 0;

-- KPI Summary View
CREATE OR REPLACE VIEW v_solar_kpi_summary AS
SELECT 
    COUNT(*) FILTER (WHERE status_category = 'ACTIVE') AS total_active_projects,
    COUNT(*) FILTER (WHERE status_category = 'COMPLETED') AS total_completed,
    COUNT(*) FILTER (WHERE status_category = 'CANCELLED' OR status_category = 'REFUND') AS total_cancelled,
    
    COALESCE(SUM(total_sales) FILTER (WHERE status_category != 'CANCELLED'), 0) AS total_sales_value,
    COALESCE(SUM(balance) FILTER (WHERE status_category = 'ACTIVE'), 0) AS total_outstanding,
    
    COUNT(*) FILTER (WHERE status ILIKE '%80%' AND status ILIKE '%pending%') AS pending_80_count,
    COUNT(*) FILTER (WHERE status ILIKE '%20%' AND status ILIKE '%pending%') AS pending_20_count,
    COUNT(*) FILTER (WHERE status ILIKE '%handover%' AND status ILIKE '%pending%') AS pending_handover_count,
    
    COALESCE(SUM(balance) FILTER (WHERE status ILIKE '%80%' AND status ILIKE '%pending%'), 0) AS pending_80_value,
    COALESCE(SUM(balance) FILTER (WHERE status ILIKE '%20%' AND status ILIKE '%pending%'), 0) AS pending_20_value
    
FROM solar_projects
WHERE is_deleted = FALSE;

-- Critical Leads View (>14 days overdue)
CREATE OR REPLACE VIEW v_critical_leads AS
SELECT 
    p.id,
    p.project_no,
    p.client_name,
    p.client_phone,
    p.status,
    p.balance AS amount,
    p.state,
    p.finalized_capacity_kwp AS system_size,
    p.total_sales AS project_value,
    
    CASE 
        WHEN p.status ILIKE '%80%' THEN '80%'
        WHEN p.status ILIKE '%20%' THEN '20%'
        ELSE 'HANDOVER'
    END AS stage,
    
    -- Calculate days overdue (from last payment date or 30 days from status change)
    COALESCE(
        (SELECT MAX(days_overdue) FROM solar_payments WHERE project_id = p.id AND status = 'PENDING'),
        30
    ) AS days_overdue,
    
    -- Last contact info
    (SELECT MAX(action_date)::DATE FROM solar_recovery_actions WHERE project_id = p.id) AS last_contact,
    
    -- Next action
    CASE 
        WHEN p.status ILIKE '%80%' THEN 'Follow up on 80% payment'
        WHEN p.status ILIKE '%20%' THEN 'Follow up on 20% payment'
        ELSE 'Schedule handover'
    END AS next_action
    
FROM solar_projects p
WHERE p.is_deleted = FALSE
    AND p.status_category = 'ACTIVE'
    AND p.balance > 0
    AND (
        p.status ILIKE '%pending%'
        OR p.status ILIKE '%payment%'
    )
ORDER BY 
    CASE 
        WHEN p.status ILIKE '%80%' THEN 1
        WHEN p.status ILIKE '%20%' THEN 2
        ELSE 3
    END,
    p.balance DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to categorize status
CREATE OR REPLACE FUNCTION categorize_status(status_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF status_text ILIKE '%completed%' THEN
        RETURN 'COMPLETED';
    ELSIF status_text ILIKE '%refund%' THEN
        RETURN 'REFUND';
    ELSIF status_text ILIKE '%cancel%' THEN
        RETURN 'CANCELLED';
    ELSE
        RETURN 'ACTIVE';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update status_category
CREATE OR REPLACE FUNCTION update_status_category()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status_category := categorize_status(NEW.status);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_status_category
    BEFORE INSERT OR UPDATE ON solar_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_status_category();

-- Function to calculate days overdue
CREATE OR REPLACE FUNCTION calculate_days_overdue(expected_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF expected_date IS NULL THEN
        RETURN 0;
    END IF;
    RETURN GREATEST(0, CURRENT_DATE - expected_date);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SAMPLE DATA VERIFICATION QUERIES
-- ============================================

-- Run these after data import to verify:
-- SELECT * FROM v_solar_kpi_summary;
-- SELECT * FROM v_critical_leads LIMIT 20;
-- SELECT * FROM v_payment_recovery_pipeline WHERE recovery_stage = '80%' LIMIT 10;
