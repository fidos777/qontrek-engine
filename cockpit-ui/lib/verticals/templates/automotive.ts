// lib/verticals/templates/automotive.ts
// Perodua - Automotive services vertical

import type { VerticalTemplate } from '../types';

export const automotiveTemplate: VerticalTemplate = {
  id: 'automotive',
  name: 'Automotive Services',
  name_ms: 'Perkhidmatan Automotif',
  description: 'Automotive service center operations, vehicle maintenance tracking, and customer management',
  icon: 'Car',
  color: '#0891B2', // Cyan

  tenant_defaults: {
    currency: 'MYR',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    date_format: 'DD/MM/YYYY',
  },

  field_mappings: [
    { generic_field: 'lead.name', vertical_label: 'Customer Name', vertical_field: 'customer.name' },
    { generic_field: 'lead.amount', vertical_label: 'Service Cost', vertical_field: 'service.total_cost', format: 'RM {{value}}' },
    { generic_field: 'lead.phone', vertical_label: 'Contact Number', vertical_field: 'customer.phone' },
    { generic_field: 'lead.email', vertical_label: 'Email', vertical_field: 'customer.email' },
    { generic_field: 'lead.stage', vertical_label: 'Service Status', vertical_field: 'service.status' },
    { generic_field: 'lead.custom_1', vertical_label: 'Vehicle Number', vertical_field: 'vehicle.registration_number' },
    { generic_field: 'lead.custom_2', vertical_label: 'Vehicle Model', vertical_field: 'vehicle.model' },
    { generic_field: 'lead.custom_3', vertical_label: 'Mileage (km)', vertical_field: 'vehicle.mileage' },
    { generic_field: 'lead.custom_4', vertical_label: 'Service Type', vertical_field: 'service.service_type' },
    { generic_field: 'lead.custom_5', vertical_label: 'Job Card Number', vertical_field: 'service.job_card_number' },
    { generic_field: 'lead.custom_6', vertical_label: 'Technician', vertical_field: 'service.technician_name' },
    { generic_field: 'lead.days_overdue', vertical_label: 'Days Since Check-in', vertical_field: 'service.days_in_workshop' },
  ],

  stages: [
    {
      id: 'booking',
      name: 'Booking',
      name_ms: 'Tempahan',
      color: '#6B7280',
      order: 1,
      auto_actions: [
        { trigger: 'days_in_stage > 1', action: 'send_reminder', template_id: 'booking_confirmation' }
      ]
    },
    { id: 'check_in', name: 'Check-in', name_ms: 'Daftar Masuk', color: '#3B82F6', order: 2 },
    { id: 'diagnosis', name: 'Diagnosis', name_ms: 'Diagnosis', color: '#8B5CF6', order: 3, sla_days: 1 },
    {
      id: 'quotation_approval',
      name: 'Quotation Approval',
      name_ms: 'Kelulusan Sebut Harga',
      color: '#F59E0B',
      order: 4,
      sla_days: 1,
      auto_actions: [
        { trigger: 'days_in_stage > 1', action: 'send_reminder', template_id: 'quotation_reminder' }
      ]
    },
    { id: 'parts_ordering', name: 'Parts Ordering', name_ms: 'Tempahan Alat Ganti', color: '#06B6D4', order: 5, sla_days: 2 },
    { id: 'in_repair', name: 'In Repair', name_ms: 'Dalam Pembaikan', color: '#10B981', order: 6 },
    { id: 'quality_check', name: 'Quality Check', name_ms: 'Pemeriksaan Kualiti', color: '#7C3AED', order: 7 },
    { id: 'ready', name: 'Ready for Collection', name_ms: 'Sedia Untuk Diambil', color: '#22C55E', order: 8 },
    { id: 'collected', name: 'Collected', name_ms: 'Telah Diambil', color: '#059669', order: 9 },
    { id: 'follow_up', name: 'Follow Up', name_ms: 'Susulan', color: '#F59E0B', order: 10 },
  ],

  kpis: [
    {
      id: 'turnaround_time',
      name: 'Avg Turnaround Time',
      name_ms: 'Purata Masa Penyelesaian',
      description: 'Average time from check-in to collection',
      formula: 'avg(service_hours) / 24',
      unit: 'days',
      target: 1,
      warning_threshold: 2,
      critical_threshold: 3,
      higher_is_better: false,
    },
    {
      id: 'customer_satisfaction',
      name: 'Customer Satisfaction',
      name_ms: 'Kepuasan Pelanggan',
      description: 'Average customer satisfaction score',
      formula: 'avg(satisfaction_score)',
      unit: 'ratio',
      target: 4.5,
      warning_threshold: 4.0,
      critical_threshold: 3.5,
      higher_is_better: true,
    },
    {
      id: 'parts_availability',
      name: 'Parts Availability',
      name_ms: 'Ketersediaan Alat Ganti',
      description: 'Percentage of parts available in stock',
      formula: 'in_stock / required * 100',
      unit: 'percentage',
      target: 95,
      warning_threshold: 85,
      critical_threshold: 70,
      higher_is_better: true,
    },
    {
      id: 'daily_jobs',
      name: 'Daily Jobs Completed',
      name_ms: 'Kerja Harian Selesai',
      description: 'Number of service jobs completed today',
      formula: 'count(completed_today)',
      unit: 'count',
      target: 20,
      warning_threshold: 15,
      critical_threshold: 10,
      higher_is_better: true,
    },
    {
      id: 'daily_revenue',
      name: 'Daily Revenue',
      name_ms: 'Hasil Harian',
      description: 'Total service revenue today',
      formula: 'sum(service_revenue)',
      unit: 'currency',
      target: 15000,
      warning_threshold: 10000,
      critical_threshold: 5000,
      higher_is_better: true,
    },
  ],

  dashboards: [
    {
      id: 'workshop',
      name: 'Workshop Overview',
      description: 'Track vehicles in workshop and service progress',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'daily_jobs' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'turnaround_time' } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'parts_availability' } },
        { widget_type: 'trust_meter', position: { col: 3, row: 0, width: 1, height: 1 } },
        { widget_type: 'stage_board', position: { col: 0, row: 1, width: 4, height: 2 } },
      ],
    },
    {
      id: 'bookings',
      name: 'Bookings',
      description: 'Manage service appointments and bookings',
      widgets: [
        { widget_type: 'calendar_widget', position: { col: 0, row: 0, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 0, width: 2, height: 2 }, config: { filter: 'booking' } },
        { widget_type: 'reminder_list', position: { col: 0, row: 2, width: 4, height: 1 } },
      ],
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Track service center performance metrics',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'daily_revenue' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'customer_satisfaction' } },
        { widget_type: 'recovery_chart', position: { col: 2, row: 0, width: 2, height: 2 }, config: { metric: 'daily_revenue' } },
        { widget_type: 'lead_heatmap', position: { col: 0, row: 1, width: 2, height: 1 } },
      ],
    },
  ],

  whatsapp_templates: [
    {
      id: 'booking_confirmation',
      name: 'service_booking_confirmation',
      purpose: 'Confirm service booking appointment',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{customer_name}}, tempahan servis untuk {{vehicle_number}} ({{vehicle_model}}) telah disahkan pada {{date}} jam {{time}}. Sila hadir 15 minit awal. - Perodua Service',
      variables: ['customer_name', 'vehicle_number', 'vehicle_model', 'date', 'time'],
      use_cases: ['booking stage', 'booking confirmed'],
    },
    {
      id: 'quotation_reminder',
      name: 'quotation_approval_reminder',
      purpose: 'Request approval for service quotation',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{customer_name}}, sebut harga servis untuk {{vehicle_number}} sebanyak RM{{amount}} menunggu kelulusan anda. Sila sahkan untuk kami meneruskan kerja pembaikan. - Perodua Service',
      variables: ['customer_name', 'vehicle_number', 'amount'],
      use_cases: ['quotation_approval stage', 'days_in_stage > 1'],
    },
    {
      id: 'service_ready',
      name: 'vehicle_ready_notification',
      purpose: 'Notify customer vehicle is ready',
      language: 'ms',
      category: 'utility',
      body_template: 'Berita baik {{customer_name}}! Kenderaan anda {{vehicle_number}} telah siap diservis. Jumlah: RM{{amount}}. Sila datang mengambil antara 8am-6pm. - Perodua Service',
      variables: ['customer_name', 'vehicle_number', 'amount'],
      use_cases: ['ready stage'],
    },
    {
      id: 'follow_up_survey',
      name: 'service_satisfaction_survey',
      purpose: 'Request customer feedback after service',
      language: 'en',
      category: 'utility',
      body_template: 'Hi {{customer_name}}, thank you for choosing Perodua Service! We hope you are satisfied with the service for {{vehicle_number}}. Please rate your experience: {{survey_link}} - Perodua Service',
      variables: ['customer_name', 'vehicle_number', 'survey_link'],
      use_cases: ['collected stage', 'days since collection = 3'],
    },
  ],

  governance: {
    required_gates: ['G13', 'G14', 'G15', 'G16', 'G18', 'G21'],
    audit_retention_days: 2555,
    pii_fields: ['customer.name', 'customer.phone', 'customer.email', 'vehicle.registration_number'],
  },

  features: {
    whatsapp_enabled: true,
    ai_suggestions_enabled: true,
    auto_reminders_enabled: true,
    multi_currency: false,
  },
};
