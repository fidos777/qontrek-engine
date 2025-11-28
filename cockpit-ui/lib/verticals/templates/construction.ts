// lib/verticals/templates/construction.ts
// CIDB - Construction projects vertical

import type { VerticalTemplate } from '../types';

export const constructionTemplate: VerticalTemplate = {
  id: 'construction',
  name: 'Construction Projects',
  name_ms: 'Projek Pembinaan',
  description: 'CIDB-registered construction project management, progress tracking, and payment milestones',
  icon: 'Building2',
  color: '#DC2626', // Red

  tenant_defaults: {
    currency: 'MYR',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    date_format: 'DD/MM/YYYY',
  },

  field_mappings: [
    { generic_field: 'lead.name', vertical_label: 'Project Name', vertical_field: 'project.name' },
    { generic_field: 'lead.amount', vertical_label: 'Contract Value', vertical_field: 'project.contract_value', format: 'RM {{value}}' },
    { generic_field: 'lead.phone', vertical_label: 'Project Manager Contact', vertical_field: 'project.pm_phone' },
    { generic_field: 'lead.email', vertical_label: 'Project Manager Email', vertical_field: 'project.pm_email' },
    { generic_field: 'lead.stage', vertical_label: 'Project Phase', vertical_field: 'project.phase' },
    { generic_field: 'lead.custom_1', vertical_label: 'CIDB Registration', vertical_field: 'project.cidb_registration' },
    { generic_field: 'lead.custom_2', vertical_label: 'Progress %', vertical_field: 'project.progress_percentage' },
    { generic_field: 'lead.custom_3', vertical_label: 'Current Milestone', vertical_field: 'project.current_milestone' },
    { generic_field: 'lead.custom_4', vertical_label: 'Site Address', vertical_field: 'project.site_address' },
    { generic_field: 'lead.custom_5', vertical_label: 'Client Name', vertical_field: 'project.client_name' },
    { generic_field: 'lead.custom_6', vertical_label: 'Budget Variance', vertical_field: 'project.budget_variance', format: '{{value}}%' },
    { generic_field: 'lead.days_overdue', vertical_label: 'Days Behind Schedule', vertical_field: 'project.days_behind_schedule' },
  ],

  stages: [
    { id: 'tender', name: 'Tender', name_ms: 'Tender', color: '#6B7280', order: 1, sla_days: 30 },
    { id: 'awarded', name: 'Award', name_ms: 'Penganugerahan', color: '#3B82F6', order: 2 },
    { id: 'mobilization', name: 'Mobilization', name_ms: 'Mobilisasi', color: '#8B5CF6', order: 3, sla_days: 14 },
    {
      id: 'foundation',
      name: 'Foundation',
      name_ms: 'Asas',
      color: '#F59E0B',
      order: 4,
      auto_actions: [
        { trigger: 'days_in_stage > 30', action: 'send_reminder', template_id: 'progress_update' }
      ]
    },
    { id: 'structure', name: 'Structure', name_ms: 'Struktur', color: '#DC2626', order: 5 },
    { id: 'mep', name: 'M&E/Plumbing', name_ms: 'M&E/Paip', color: '#06B6D4', order: 6 },
    { id: 'finishing', name: 'Finishing', name_ms: 'Kemasan', color: '#10B981', order: 7 },
    { id: 'testing', name: 'Testing & QC', name_ms: 'Ujian & QC', color: '#7C3AED', order: 8, sla_days: 14 },
    { id: 'handover', name: 'Handover', name_ms: 'Serah Kunci', color: '#22C55E', order: 9 },
    { id: 'defect_liability', name: 'Defect Liability', name_ms: 'Tempoh Liabiliti Kecacatan', color: '#F59E0B', order: 10 },
    { id: 'completed', name: 'Completed', name_ms: 'Selesai', color: '#059669', order: 11 },
  ],

  kpis: [
    {
      id: 'project_completion',
      name: 'Avg Project Completion',
      name_ms: 'Purata Penyelesaian Projek',
      description: 'Average completion percentage across active projects',
      formula: 'avg(progress_percentage)',
      unit: 'percentage',
      target: 75,
      warning_threshold: 50,
      critical_threshold: 30,
      higher_is_better: true,
    },
    {
      id: 'budget_variance',
      name: 'Budget Variance',
      name_ms: 'Varians Bajet',
      description: 'Average budget variance across projects (negative is over budget)',
      formula: 'avg(budget_variance)',
      unit: 'percentage',
      target: 0,
      warning_threshold: -5,
      critical_threshold: -10,
      higher_is_better: true,
    },
    {
      id: 'schedule_adherence',
      name: 'Schedule Adherence',
      name_ms: 'Pematuhan Jadual',
      description: 'Percentage of projects on or ahead of schedule',
      formula: 'on_schedule / total_active * 100',
      unit: 'percentage',
      target: 90,
      warning_threshold: 75,
      critical_threshold: 60,
      higher_is_better: true,
    },
    {
      id: 'safety_incidents',
      name: 'Safety Incidents',
      name_ms: 'Insiden Keselamatan',
      description: 'Number of safety incidents this month',
      formula: 'count(safety_incidents)',
      unit: 'count',
      target: 0,
      warning_threshold: 2,
      critical_threshold: 5,
      higher_is_better: false,
    },
    {
      id: 'total_contract_value',
      name: 'Total Contract Value',
      name_ms: 'Jumlah Nilai Kontrak',
      description: 'Sum of all active project contract values',
      formula: 'sum(contract_value)',
      unit: 'currency',
      target: 10000000,
      warning_threshold: 5000000,
      critical_threshold: 1000000,
      higher_is_better: true,
    },
  ],

  dashboards: [
    {
      id: 'overview',
      name: 'Project Overview',
      description: 'High-level view of all construction projects',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'total_contract_value' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'project_completion' } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'schedule_adherence' } },
        { widget_type: 'kpi_card', position: { col: 3, row: 0, width: 1, height: 1 }, config: { kpi_id: 'safety_incidents' } },
        { widget_type: 'pipeline_funnel', position: { col: 0, row: 1, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 1, width: 2, height: 2 }, config: { filter: 'active' } },
      ],
    },
    {
      id: 'progress',
      name: 'Progress Tracking',
      description: 'Track project milestones and progress',
      widgets: [
        { widget_type: 'stage_board', position: { col: 0, row: 0, width: 4, height: 2 } },
        { widget_type: 'kpi_card', position: { col: 0, row: 2, width: 1, height: 1 }, config: { kpi_id: 'budget_variance' } },
        { widget_type: 'activity_timeline', position: { col: 1, row: 2, width: 3, height: 2 } },
      ],
    },
    {
      id: 'payments',
      name: 'Payment Milestones',
      description: 'Track payment claims and milestones',
      widgets: [
        { widget_type: 'recovery_chart', position: { col: 0, row: 0, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 0, width: 2, height: 2 }, config: { filter: 'payment_due' } },
        { widget_type: 'reminder_list', position: { col: 0, row: 2, width: 4, height: 1 } },
      ],
    },
  ],

  whatsapp_templates: [
    {
      id: 'progress_update',
      name: 'project_progress_update',
      purpose: 'Send progress update to client',
      language: 'ms',
      category: 'utility',
      body_template: 'Kemas kini projek {{project_name}}: Progres semasa {{progress}}%. Fasa: {{phase}}. Tarikh jangkaan siap: {{completion_date}}. Hubungi kami untuk maklumat lanjut. - CIDB Construction',
      variables: ['project_name', 'progress', 'phase', 'completion_date'],
      use_cases: ['weekly update', 'milestone complete'],
    },
    {
      id: 'payment_milestone',
      name: 'payment_claim_notification',
      purpose: 'Notify client of payment milestone claim',
      language: 'en',
      category: 'utility',
      body_template: 'Payment Claim Notice: Project {{project_name}} has reached {{milestone}} milestone. Claim amount: RM{{amount}}. Please process payment within 30 days as per contract terms. - CIDB Construction',
      variables: ['project_name', 'milestone', 'amount'],
      use_cases: ['milestone complete', 'payment due'],
    },
    {
      id: 'site_inspection',
      name: 'site_inspection_notice',
      purpose: 'Notify of scheduled site inspection',
      language: 'ms',
      category: 'utility',
      body_template: 'Notis: Pemeriksaan tapak untuk {{project_name}} dijadualkan pada {{date}} jam {{time}}. Sila pastikan kehadiran wakil di tapak. - CIDB Construction',
      variables: ['project_name', 'date', 'time'],
      use_cases: ['inspection scheduled'],
    },
    {
      id: 'handover_notice',
      name: 'project_handover_notification',
      purpose: 'Notify client of project handover',
      language: 'ms',
      category: 'utility',
      body_template: 'Tahniah! Projek {{project_name}} telah siap. Tarikh serah kunci: {{handover_date}}. Sila hubungi kami untuk mengesahkan masa yang sesuai. - CIDB Construction',
      variables: ['project_name', 'handover_date'],
      use_cases: ['handover stage'],
    },
  ],

  governance: {
    required_gates: ['G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G21'],
    audit_retention_days: 3650, // 10 years for construction records
    pii_fields: ['project.pm_phone', 'project.pm_email', 'project.client_name', 'project.site_address'],
  },

  features: {
    whatsapp_enabled: true,
    ai_suggestions_enabled: true,
    auto_reminders_enabled: true,
    multi_currency: false,
  },
};
