// lib/verticals/templates/takaful.ts
// GFR - Islamic insurance/takaful vertical

import type { VerticalTemplate } from '../types';

export const takafulTemplate: VerticalTemplate = {
  id: 'takaful',
  name: 'Islamic Insurance (Takaful)',
  name_ms: 'Insurans Islam (Takaful)',
  description: 'Islamic insurance and takaful policy management with Shariah-compliant processes',
  icon: 'Shield',
  color: '#059669', // Emerald

  tenant_defaults: {
    currency: 'MYR',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    date_format: 'DD/MM/YYYY',
  },

  field_mappings: [
    { generic_field: 'lead.name', vertical_label: 'Policyholder Name', vertical_field: 'policyholder.name' },
    { generic_field: 'lead.amount', vertical_label: 'Coverage Amount', vertical_field: 'policy.coverage_amount', format: 'RM {{value}}' },
    { generic_field: 'lead.phone', vertical_label: 'Contact Number', vertical_field: 'policyholder.phone' },
    { generic_field: 'lead.email', vertical_label: 'Email', vertical_field: 'policyholder.email' },
    { generic_field: 'lead.stage', vertical_label: 'Policy Status', vertical_field: 'policy.status' },
    { generic_field: 'lead.custom_1', vertical_label: 'Policy Number', vertical_field: 'policy.policy_number' },
    { generic_field: 'lead.custom_2', vertical_label: 'Product Type', vertical_field: 'policy.product_type' },
    { generic_field: 'lead.custom_3', vertical_label: 'Premium Amount', vertical_field: 'policy.premium_amount', format: 'RM {{value}}' },
    { generic_field: 'lead.custom_4', vertical_label: 'Beneficiary', vertical_field: 'policy.beneficiary' },
    { generic_field: 'lead.custom_5', vertical_label: 'Claim Number', vertical_field: 'claim.claim_number' },
    { generic_field: 'lead.custom_6', vertical_label: 'Claim Amount', vertical_field: 'claim.claim_amount', format: 'RM {{value}}' },
    { generic_field: 'lead.days_overdue', vertical_label: 'Days Since Premium Due', vertical_field: 'policy.days_overdue' },
  ],

  stages: [
    { id: 'application', name: 'Application', name_ms: 'Permohonan', color: '#6B7280', order: 1 },
    { id: 'underwriting', name: 'Underwriting', name_ms: 'Pengunderaitan', color: '#3B82F6', order: 2, sla_days: 5 },
    { id: 'policy_issued', name: 'Policy Issued', name_ms: 'Polisi Dikeluarkan', color: '#22C55E', order: 3 },
    { id: 'active', name: 'Active', name_ms: 'Aktif', color: '#10B981', order: 4 },
    { id: 'claim_filed', name: 'Claim Filed', name_ms: 'Tuntutan Difailkan', color: '#F59E0B', order: 5, sla_days: 2 },
    {
      id: 'claim_processing',
      name: 'Claim Processing',
      name_ms: 'Pemprosesan Tuntutan',
      color: '#8B5CF6',
      order: 6,
      sla_days: 14,
      auto_actions: [
        { trigger: 'days_in_stage > 7', action: 'send_reminder', template_id: 'claim_update' }
      ]
    },
    { id: 'claim_paid', name: 'Claim Paid', name_ms: 'Tuntutan Dibayar', color: '#059669', order: 7 },
    { id: 'claim_rejected', name: 'Claim Rejected', name_ms: 'Tuntutan Ditolak', color: '#EF4444', order: 8 },
    {
      id: 'renewal_due',
      name: 'Renewal Due',
      name_ms: 'Pembaharuan',
      color: '#F59E0B',
      order: 9,
      sla_days: 30,
      auto_actions: [
        { trigger: 'days_in_stage > 14', action: 'send_reminder', template_id: 'renewal_reminder' }
      ]
    },
    { id: 'lapsed', name: 'Lapsed', name_ms: 'Luput', color: '#6B7280', order: 10 },
  ],

  kpis: [
    {
      id: 'claims_ratio',
      name: 'Claims Ratio',
      name_ms: 'Nisbah Tuntutan',
      description: 'Ratio of claims paid to premiums collected',
      formula: 'claims_paid / premiums_collected * 100',
      unit: 'percentage',
      target: 60,
      warning_threshold: 70,
      critical_threshold: 80,
      higher_is_better: false,
    },
    {
      id: 'renewal_rate',
      name: 'Policy Renewal Rate',
      name_ms: 'Kadar Pembaharuan Polisi',
      description: 'Percentage of policies renewed at expiry',
      formula: 'renewed / due_for_renewal * 100',
      unit: 'percentage',
      target: 85,
      warning_threshold: 75,
      critical_threshold: 60,
      higher_is_better: true,
    },
    {
      id: 'avg_claim_time',
      name: 'Avg Claim Processing Time',
      name_ms: 'Purata Masa Pemprosesan Tuntutan',
      description: 'Average days to process and settle claims',
      formula: 'avg(claim_processing_days)',
      unit: 'days',
      target: 7,
      warning_threshold: 14,
      critical_threshold: 21,
      higher_is_better: false,
    },
    {
      id: 'total_premiums',
      name: 'Total Premiums',
      name_ms: 'Jumlah Premium',
      description: 'Total premiums collected this period',
      formula: 'sum(premium_amount)',
      unit: 'currency',
      target: 500000,
      warning_threshold: 300000,
      critical_threshold: 100000,
      higher_is_better: true,
    },
    {
      id: 'pending_claims',
      name: 'Pending Claims Value',
      name_ms: 'Nilai Tuntutan Tertangguh',
      description: 'Total value of claims pending processing',
      formula: 'sum(pending_claim_amount)',
      unit: 'currency',
      target: 0,
      warning_threshold: 200000,
      critical_threshold: 500000,
      higher_is_better: false,
    },
  ],

  dashboards: [
    {
      id: 'claims',
      name: 'Claims Management',
      description: 'Track and manage insurance claims',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'pending_claims' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'claims_ratio' } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'avg_claim_time' } },
        { widget_type: 'trust_meter', position: { col: 3, row: 0, width: 1, height: 1 } },
        { widget_type: 'claims_chart', position: { col: 0, row: 1, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 1, width: 2, height: 2 }, config: { filter: 'pending_claims' } },
      ],
    },
    {
      id: 'policies',
      name: 'Policy Overview',
      description: 'Track policy lifecycle and renewals',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'total_premiums' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'renewal_rate' } },
        { widget_type: 'pipeline_funnel', position: { col: 2, row: 0, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 0, row: 1, width: 2, height: 2 }, config: { filter: 'renewal_due' } },
        { widget_type: 'reminder_list', position: { col: 0, row: 3, width: 4, height: 1 } },
      ],
    },
  ],

  whatsapp_templates: [
    {
      id: 'premium_reminder',
      name: 'premium_due_reminder',
      purpose: 'Remind policyholder about premium payment due',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{policyholder_name}}, premium takaful anda sebanyak RM{{amount}} akan tamat tempoh pada {{due_date}}. Sila jelaskan bayaran untuk memastikan perlindungan anda berterusan. - GFR Takaful',
      variables: ['policyholder_name', 'amount', 'due_date'],
      use_cases: ['premium due', 'renewal_due stage'],
    },
    {
      id: 'claim_update',
      name: 'claim_status_update',
      purpose: 'Update policyholder on claim status',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{policyholder_name}}, tuntutan anda (No: {{claim_number}}) sedang diproses. Status semasa: {{status}}. Kami akan menghubungi anda sekiranya memerlukan dokumen tambahan. - GFR Takaful',
      variables: ['policyholder_name', 'claim_number', 'status'],
      use_cases: ['claim_processing stage'],
    },
    {
      id: 'renewal_reminder',
      name: 'policy_renewal_reminder',
      purpose: 'Remind policyholder about policy renewal',
      language: 'en',
      category: 'utility',
      body_template: 'Dear {{policyholder_name}}, your takaful policy ({{policy_number}}) expires on {{expiry_date}}. Renew now to maintain uninterrupted coverage. Contact us for renewal options. - GFR Takaful',
      variables: ['policyholder_name', 'policy_number', 'expiry_date'],
      use_cases: ['renewal_due stage', 'days before expiry < 30'],
    },
    {
      id: 'claim_approved',
      name: 'claim_approval_notification',
      purpose: 'Notify policyholder of claim approval',
      language: 'ms',
      category: 'utility',
      body_template: 'Tahniah {{policyholder_name}}! Tuntutan anda (No: {{claim_number}}) sebanyak RM{{amount}} telah diluluskan. Bayaran akan dikreditkan dalam 3-5 hari bekerja. - GFR Takaful',
      variables: ['policyholder_name', 'claim_number', 'amount'],
      use_cases: ['claim_paid stage'],
    },
  ],

  governance: {
    required_gates: ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G21'],
    audit_retention_days: 2555, // 7 years for insurance records
    pii_fields: ['policyholder.name', 'policyholder.phone', 'policyholder.email', 'policyholder.ic_number', 'policy.beneficiary'],
  },

  features: {
    whatsapp_enabled: true,
    ai_suggestions_enabled: true,
    auto_reminders_enabled: true,
    multi_currency: false,
  },
};
