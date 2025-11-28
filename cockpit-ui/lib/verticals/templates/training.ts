// lib/verticals/templates/training.ts
// HRDC - Training and certification vertical

import type { VerticalTemplate } from '../types';

export const trainingTemplate: VerticalTemplate = {
  id: 'training',
  name: 'Training & Certification',
  name_ms: 'Latihan & Pensijilan',
  description: 'HRDC-claimable training programs, certification management, and participant tracking',
  icon: 'GraduationCap',
  color: '#2563EB', // Blue

  tenant_defaults: {
    currency: 'MYR',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    date_format: 'DD/MM/YYYY',
  },

  field_mappings: [
    { generic_field: 'lead.name', vertical_label: 'Participant Name', vertical_field: 'participant.name' },
    { generic_field: 'lead.amount', vertical_label: 'Course Fee', vertical_field: 'enrollment.course_fee', format: 'RM {{value}}' },
    { generic_field: 'lead.phone', vertical_label: 'Contact Number', vertical_field: 'participant.phone' },
    { generic_field: 'lead.email', vertical_label: 'Email', vertical_field: 'participant.email' },
    { generic_field: 'lead.stage', vertical_label: 'Enrollment Status', vertical_field: 'enrollment.status' },
    { generic_field: 'lead.custom_1', vertical_label: 'Course Name', vertical_field: 'course.name' },
    { generic_field: 'lead.custom_2', vertical_label: 'HRDC Claim Number', vertical_field: 'enrollment.hrdc_claim_number' },
    { generic_field: 'lead.custom_3', vertical_label: 'Training Hours', vertical_field: 'course.training_hours' },
    { generic_field: 'lead.custom_4', vertical_label: 'Company Name', vertical_field: 'participant.company_name' },
    { generic_field: 'lead.custom_5', vertical_label: 'Certification Level', vertical_field: 'course.certification_level' },
    { generic_field: 'lead.custom_6', vertical_label: 'Assessment Score', vertical_field: 'enrollment.assessment_score' },
    { generic_field: 'lead.days_overdue', vertical_label: 'Days Since Registration', vertical_field: 'enrollment.days_since_registration' },
  ],

  stages: [
    { id: 'registration', name: 'Registration', name_ms: 'Pendaftaran', color: '#6B7280', order: 1 },
    {
      id: 'payment_pending',
      name: 'Payment Pending',
      name_ms: 'Menunggu Bayaran',
      color: '#F59E0B',
      order: 2,
      sla_days: 3,
      auto_actions: [
        { trigger: 'days_in_stage > 3', action: 'send_reminder', template_id: 'payment_reminder' }
      ]
    },
    { id: 'payment_confirmed', name: 'Payment Confirmed', name_ms: 'Bayaran Disahkan', color: '#3B82F6', order: 3 },
    { id: 'enrolled', name: 'Enrolled', name_ms: 'Terdaftar', color: '#8B5CF6', order: 4 },
    { id: 'in_progress', name: 'In Progress', name_ms: 'Dalam Progres', color: '#10B981', order: 5 },
    { id: 'assessment', name: 'Assessment', name_ms: 'Penilaian', color: '#06B6D4', order: 6, sla_days: 7 },
    { id: 'certified', name: 'Certified', name_ms: 'Bertauliah', color: '#22C55E', order: 7 },
    { id: 'certificate_issued', name: 'Certificate Issued', name_ms: 'Sijil Dikeluarkan', color: '#059669', order: 8 },
    { id: 'hrdc_claimed', name: 'HRDC Claimed', name_ms: 'Tuntutan HRDC', color: '#7C3AED', order: 9 },
    { id: 'cancelled', name: 'Cancelled', name_ms: 'Dibatalkan', color: '#EF4444', order: 10 },
  ],

  kpis: [
    {
      id: 'enrollment_rate',
      name: 'Enrollment Rate',
      name_ms: 'Kadar Pendaftaran',
      description: 'Percentage of registrations converted to enrollments',
      formula: 'enrolled / registered * 100',
      unit: 'percentage',
      target: 80,
      warning_threshold: 60,
      critical_threshold: 40,
      higher_is_better: true,
    },
    {
      id: 'completion_rate',
      name: 'Completion Rate',
      name_ms: 'Kadar Penyelesaian',
      description: 'Percentage of enrolled participants who complete the course',
      formula: 'completed / enrolled * 100',
      unit: 'percentage',
      target: 95,
      warning_threshold: 85,
      critical_threshold: 70,
      higher_is_better: true,
    },
    {
      id: 'certification_pass_rate',
      name: 'Certification Pass Rate',
      name_ms: 'Kadar Lulus Pensijilan',
      description: 'Percentage of participants who pass certification assessment',
      formula: 'passed / assessed * 100',
      unit: 'percentage',
      target: 90,
      warning_threshold: 80,
      critical_threshold: 70,
      higher_is_better: true,
    },
    {
      id: 'hrdc_claim_rate',
      name: 'HRDC Claim Rate',
      name_ms: 'Kadar Tuntutan HRDC',
      description: 'Percentage of eligible enrollments with HRDC claims',
      formula: 'claimed / eligible * 100',
      unit: 'percentage',
      target: 85,
      warning_threshold: 70,
      critical_threshold: 50,
      higher_is_better: true,
    },
    {
      id: 'total_participants',
      name: 'Active Participants',
      name_ms: 'Peserta Aktif',
      description: 'Number of participants currently enrolled',
      formula: 'count(active_participants)',
      unit: 'count',
      target: 200,
      warning_threshold: 100,
      critical_threshold: 50,
      higher_is_better: true,
    },
  ],

  dashboards: [
    {
      id: 'enrollments',
      name: 'Enrollment Management',
      description: 'Track participant enrollments and payments',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'total_participants' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'enrollment_rate' } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'completion_rate' } },
        { widget_type: 'trust_meter', position: { col: 3, row: 0, width: 1, height: 1 } },
        { widget_type: 'pipeline_funnel', position: { col: 0, row: 1, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 1, width: 2, height: 2 }, config: { filter: 'payment_pending' } },
      ],
    },
    {
      id: 'certifications',
      name: 'Certification Tracking',
      description: 'Track assessments and certifications',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'certification_pass_rate' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'hrdc_claim_rate' } },
        { widget_type: 'lead_table', position: { col: 0, row: 1, width: 2, height: 2 }, config: { filter: 'assessment' } },
        { widget_type: 'lead_table', position: { col: 2, row: 1, width: 2, height: 2 }, config: { filter: 'certified' } },
      ],
    },
    {
      id: 'schedule',
      name: 'Training Schedule',
      description: 'View and manage training sessions',
      widgets: [
        { widget_type: 'calendar_widget', position: { col: 0, row: 0, width: 2, height: 2 } },
        { widget_type: 'activity_timeline', position: { col: 2, row: 0, width: 2, height: 2 } },
        { widget_type: 'reminder_list', position: { col: 0, row: 2, width: 4, height: 1 } },
      ],
    },
  ],

  whatsapp_templates: [
    {
      id: 'payment_reminder',
      name: 'course_payment_reminder',
      purpose: 'Remind participant about course payment',
      language: 'ms',
      category: 'utility',
      body_template: 'Salam {{participant_name}}, pendaftaran anda untuk kursus {{course_name}} sedang menunggu pembayaran sebanyak RM{{amount}}. Sila jelaskan sebelum {{due_date}} untuk mengesahkan tempat anda. - HRDC Training',
      variables: ['participant_name', 'course_name', 'amount', 'due_date'],
      use_cases: ['payment_pending stage', 'days_in_stage > 3'],
    },
    {
      id: 'enrollment_confirmation',
      name: 'enrollment_confirmed',
      purpose: 'Confirm course enrollment',
      language: 'ms',
      category: 'utility',
      body_template: 'Tahniah {{participant_name}}! Pendaftaran anda untuk {{course_name}} telah disahkan. Kursus bermula pada {{start_date}} di {{venue}}. Sila hadir 30 minit awal. - HRDC Training',
      variables: ['participant_name', 'course_name', 'start_date', 'venue'],
      use_cases: ['enrolled stage'],
    },
    {
      id: 'class_reminder',
      name: 'class_session_reminder',
      purpose: 'Remind participant of upcoming class',
      language: 'en',
      category: 'utility',
      body_template: 'Hi {{participant_name}}, reminder: Your {{course_name}} class is tomorrow at {{time}}. Location: {{venue}}. Please bring your laptop and training materials. See you there! - HRDC Training',
      variables: ['participant_name', 'course_name', 'time', 'venue'],
      use_cases: ['in_progress stage', 'class tomorrow'],
    },
    {
      id: 'certificate_ready',
      name: 'certificate_notification',
      purpose: 'Notify participant certificate is ready',
      language: 'ms',
      category: 'utility',
      body_template: 'Tahniah {{participant_name}}! Sijil {{course_name}} anda telah sedia. Sila muat turun sijil anda di: {{certificate_link}} atau kumpul di pejabat kami. - HRDC Training',
      variables: ['participant_name', 'course_name', 'certificate_link'],
      use_cases: ['certificate_issued stage'],
    },
  ],

  governance: {
    required_gates: ['G13', 'G14', 'G15', 'G16', 'G18', 'G21'],
    audit_retention_days: 2555,
    pii_fields: ['participant.name', 'participant.phone', 'participant.email', 'participant.ic_number', 'participant.company_name'],
  },

  features: {
    whatsapp_enabled: true,
    ai_suggestions_enabled: true,
    auto_reminders_enabled: true,
    multi_currency: false,
  },
};
