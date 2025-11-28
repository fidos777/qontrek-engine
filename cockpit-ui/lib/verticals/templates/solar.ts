// lib/verticals/templates/solar.ts
// Voltek - Solar installation and payment recovery vertical

import type { VerticalTemplate } from '../types';

export const solarTemplate: VerticalTemplate = {
  id: 'solar',
  name: 'Solar Installation',
  name_ms: 'Pemasangan Solar',
  description: 'Solar panel installation and payment recovery for residential and commercial projects',
  icon: 'Sun',
  color: '#F59E0B', // Amber/Orange

  tenant_defaults: {
    currency: 'MYR',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    date_format: 'DD/MM/YYYY',
  },

  field_mappings: [
    { generic_field: 'lead.name', vertical_label: 'Customer Name', vertical_field: 'customer.name' },
    { generic_field: 'lead.amount', vertical_label: 'System Cost', vertical_field: 'project.system_cost', format: 'RM {{value}}' },
    { generic_field: 'lead.phone', vertical_label: 'Contact Number', vertical_field: 'customer.phone' },
    { generic_field: 'lead.email', vertical_label: 'Email', vertical_field: 'customer.email' },
    { generic_field: 'lead.stage', vertical_label: 'Project Stage', vertical_field: 'project.stage' },
    { generic_field: 'lead.custom_1', vertical_label: 'System Size (kW)', vertical_field: 'project.system_size_kw' },
    { generic_field: 'lead.custom_2', vertical_label: 'Panel Type', vertical_field: 'project.panel_type' },
    { generic_field: 'lead.custom_3', vertical_label: 'Installation Address', vertical_field: 'project.address' },
    { generic_field: 'lead.custom_4', vertical_label: 'TNB Account', vertical_field: 'project.tnb_account' },
    { generic_field: 'lead.days_overdue', vertical_label: 'Days Since Last Payment', vertical_field: 'payment.days_overdue' },
    { generic_field: 'lead.custom_5', vertical_label: 'Inverter Model', vertical_field: 'project.inverter_model' },
    { generic_field: 'lead.custom_6', vertical_label: 'Roof Type', vertical_field: 'project.roof_type' },
  ],

  stages: [
    { id: 'inquiry', name: 'Inquiry', name_ms: 'Pertanyaan', color: '#6B7280', order: 1 },
    { id: 'site_visit', name: 'Site Visit', name_ms: 'Lawatan Tapak', color: '#3B82F6', order: 2, sla_days: 3 },
    { id: 'quotation', name: 'Quotation', name_ms: 'Sebut Harga', color: '#8B5CF6', order: 3, sla_days: 2 },
    {
      id: 'deposit_80',
      name: '80% Deposit',
      name_ms: 'Deposit 80%',
      color: '#F59E0B',
      order: 4,
      sla_days: 7,
      auto_actions: [
        { trigger: 'days_in_stage > 7', action: 'send_reminder', template_id: 'payment_reminder_80' }
      ]
    },
    { id: 'installation', name: 'Installation', name_ms: 'Pemasangan', color: '#10B981', order: 5 },
    { id: 'tnb_approval', name: 'TNB Approval', name_ms: 'Kelulusan TNB', color: '#06B6D4', order: 6 },
    {
      id: 'balance_20',
      name: '20% Balance',
      name_ms: 'Baki 20%',
      color: '#EF4444',
      order: 7,
      sla_days: 14,
      auto_actions: [
        { trigger: 'days_in_stage > 14', action: 'send_reminder', template_id: 'payment_reminder_20' },
        { trigger: 'days_in_stage > 21', action: 'escalate', template_id: 'escalation_notice' }
      ]
    },
    { id: 'completed', name: 'Completed', name_ms: 'Selesai', color: '#22C55E', order: 8 },
  ],

  kpis: [
    {
      id: 'recovery_rate_7d',
      name: '7-Day Recovery Rate',
      name_ms: 'Kadar Pemulihan 7 Hari',
      description: 'Percentage of payments recovered within 7 days of due date',
      formula: 'recovered_7d / total_due * 100',
      unit: 'percentage',
      target: 85,
      warning_threshold: 70,
      critical_threshold: 50,
      higher_is_better: true,
    },
    {
      id: 'total_recoverable',
      name: 'Total Recoverable',
      name_ms: 'Jumlah Boleh Dipulihkan',
      description: 'Total outstanding amount pending recovery',
      formula: 'sum(outstanding_amount)',
      unit: 'currency',
      target: 0,
      warning_threshold: 100000,
      critical_threshold: 200000,
      higher_is_better: false,
    },
    {
      id: 'avg_days_to_payment',
      name: 'Avg Days to Payment',
      name_ms: 'Purata Hari Pembayaran',
      description: 'Average number of days to receive payment after invoice',
      formula: 'avg(days_to_payment)',
      unit: 'days',
      target: 14,
      warning_threshold: 21,
      critical_threshold: 30,
      higher_is_better: false,
    },
    {
      id: 'conversion_rate',
      name: 'Conversion Rate',
      name_ms: 'Kadar Penukaran',
      description: 'Percentage of inquiries converted to completed installations',
      formula: 'completed / inquiries * 100',
      unit: 'percentage',
      target: 25,
      warning_threshold: 15,
      critical_threshold: 10,
      higher_is_better: true,
    },
    {
      id: 'pipeline_value',
      name: 'Pipeline Value',
      name_ms: 'Nilai Saluran',
      description: 'Total value of active projects in pipeline',
      formula: 'sum(project_value)',
      unit: 'currency',
      target: 500000,
      warning_threshold: 300000,
      critical_threshold: 100000,
      higher_is_better: true,
    },
  ],

  dashboards: [
    {
      id: 'recovery',
      name: 'Payment Recovery',
      description: 'Track and manage payment collections',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'total_recoverable' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'recovery_rate_7d' } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'avg_days_to_payment' } },
        { widget_type: 'trust_meter', position: { col: 3, row: 0, width: 1, height: 1 } },
        { widget_type: 'recovery_chart', position: { col: 0, row: 1, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 1, width: 2, height: 2 }, config: { filter: 'overdue' } },
        { widget_type: 'reminder_list', position: { col: 0, row: 3, width: 2, height: 1 } },
        { widget_type: 'success_feed', position: { col: 2, row: 3, width: 2, height: 1 } },
      ],
    },
    {
      id: 'pipeline',
      name: 'Sales Pipeline',
      description: 'Track leads through the sales funnel',
      widgets: [
        { widget_type: 'pipeline_funnel', position: { col: 0, row: 0, width: 2, height: 2 } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'conversion_rate' } },
        { widget_type: 'kpi_card', position: { col: 3, row: 0, width: 1, height: 1 }, config: { kpi_id: 'pipeline_value' } },
        { widget_type: 'lead_heatmap', position: { col: 2, row: 1, width: 2, height: 1 } },
        { widget_type: 'lead_table', position: { col: 0, row: 2, width: 4, height: 2 } },
      ],
    },
    {
      id: 'operations',
      name: 'Operations',
      description: 'Track installation progress and scheduling',
      widgets: [
        { widget_type: 'stage_board', position: { col: 0, row: 0, width: 4, height: 2 } },
        { widget_type: 'calendar_widget', position: { col: 0, row: 2, width: 2, height: 2 } },
        { widget_type: 'activity_timeline', position: { col: 2, row: 2, width: 2, height: 2 } },
      ],
    },
  ],

  whatsapp_templates: [
    {
      id: 'payment_reminder_80',
      name: 'payment_reminder_deposit',
      purpose: 'Remind customer about 80% deposit payment',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{customer_name}}, ini adalah peringatan mesra untuk deposit 80% projek solar anda sebanyak RM{{amount}}. Sila buat pembayaran sebelum {{due_date}} untuk memastikan pemasangan mengikut jadual. Terima kasih. - Voltek Energy',
      variables: ['customer_name', 'amount', 'due_date'],
      use_cases: ['deposit_80 stage', 'days_overdue > 3'],
    },
    {
      id: 'payment_reminder_20',
      name: 'payment_reminder_balance',
      purpose: 'Remind customer about 20% balance payment',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{customer_name}}, pemasangan solar anda telah siap! Baki 20% sebanyak RM{{amount}} perlu dijelaskan untuk pengaktifan sistem. Sila hubungi kami jika ada sebarang pertanyaan. - Voltek Energy',
      variables: ['customer_name', 'amount'],
      use_cases: ['balance_20 stage', 'installation complete'],
    },
    {
      id: 'appointment_confirm',
      name: 'site_visit_confirmation',
      purpose: 'Confirm site visit appointment',
      language: 'en',
      category: 'utility',
      body_template: 'Hi {{customer_name}}, this is to confirm your site visit appointment on {{date}} at {{time}}. Our technician {{technician_name}} will arrive at your location. Please ensure someone is available. Thank you! - Voltek Energy',
      variables: ['customer_name', 'date', 'time', 'technician_name'],
      use_cases: ['site_visit scheduled'],
    },
    {
      id: 'installation_complete',
      name: 'installation_notification',
      purpose: 'Notify customer installation is complete',
      language: 'ms',
      category: 'utility',
      body_template: 'Tahniah {{customer_name}}! Pemasangan sistem solar {{system_size}}kW anda telah selesai. Kami sedang memproses kelulusan TNB. Anda akan dihubungi dalam masa 5-7 hari bekerja. - Voltek Energy',
      variables: ['customer_name', 'system_size'],
      use_cases: ['installation stage complete'],
    },
    {
      id: 'tnb_approved',
      name: 'tnb_approval_notification',
      purpose: 'Notify customer TNB approval received',
      language: 'ms',
      category: 'utility',
      body_template: 'Berita baik {{customer_name}}! Kelulusan TNB untuk sistem solar anda telah diterima. Sistem boleh diaktifkan setelah baki pembayaran dijelaskan. Hubungi kami untuk maklumat lanjut. - Voltek Energy',
      variables: ['customer_name'],
      use_cases: ['tnb_approval stage complete'],
    },
  ],

  governance: {
    required_gates: ['G13', 'G14', 'G15', 'G16', 'G18', 'G21'],
    audit_retention_days: 2555, // 7 years for financial records
    pii_fields: ['customer.name', 'customer.phone', 'customer.email', 'customer.ic_number', 'project.address'],
  },

  features: {
    whatsapp_enabled: true,
    ai_suggestions_enabled: true,
    auto_reminders_enabled: true,
    multi_currency: false,
  },
};
