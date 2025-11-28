// lib/verticals/mock-data/construction-data.ts
// CIDB - Construction projects mock data

export interface ConstructionProject {
  id: string;
  project: {
    name: string;
    cidb_registration: string;
    contract_value: number;
    progress_percentage: number;
    current_milestone: string;
    site_address: string;
    client_name: string;
    pm_phone: string;
    pm_email: string;
    phase: string;
    budget_variance: number;
    days_behind_schedule: number;
    start_date: string;
    target_completion: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ConstructionSummary {
  total_projects: number;
  total_contract_value: number;
  avg_project_completion: number;
  budget_variance_avg: number;
  schedule_adherence: number;
  safety_incidents_mtd: number;
}

export interface ConstructionMockData {
  projects: ConstructionProject[];
  summary: ConstructionSummary;
  payment_milestones: Array<{ id: string; project_name: string; milestone: string; amount: number; due_date: string }>;
  upcoming_inspections: Array<{ id: string; project_name: string; inspection_type: string; date: string }>;
}

export const constructionMockData: ConstructionMockData = {
  projects: [
    {
      id: 'proj-001',
      project: {
        name: 'Residensi Harmoni Tower A',
        cidb_registration: 'CIDB/G7/2024/001234',
        contract_value: 45000000,
        progress_percentage: 65,
        current_milestone: 'Structure - Level 15',
        site_address: 'Lot 1234, Jalan Ampang, 50450 Kuala Lumpur',
        client_name: 'Harmoni Development Sdn Bhd',
        pm_phone: '+60123456789',
        pm_email: 'pm.harmoni@construction.my',
        phase: 'structure',
        budget_variance: -2.5,
        days_behind_schedule: 5,
        start_date: '2023-06-01',
        target_completion: '2025-06-30',
      },
      created_at: '2023-05-15T09:00:00Z',
      updated_at: '2024-11-22T14:30:00Z',
    },
    {
      id: 'proj-002',
      project: {
        name: 'Pusat Komersial Prima',
        cidb_registration: 'CIDB/G6/2024/002345',
        contract_value: 28000000,
        progress_percentage: 35,
        current_milestone: 'Foundation - Piling Complete',
        site_address: 'Lot 567, Jalan Sultan Ismail, 50250 Kuala Lumpur',
        client_name: 'Prima Commercial Bhd',
        pm_phone: '+60198765432',
        pm_email: 'pm.prima@build.my',
        phase: 'foundation',
        budget_variance: 0,
        days_behind_schedule: 0,
        start_date: '2024-03-01',
        target_completion: '2025-09-30',
      },
      created_at: '2024-02-15T11:00:00Z',
      updated_at: '2024-11-20T10:00:00Z',
    },
    {
      id: 'proj-003',
      project: {
        name: 'Warehouse Complex Phase 2',
        cidb_registration: 'CIDB/G5/2024/003456',
        contract_value: 15000000,
        progress_percentage: 85,
        current_milestone: 'Finishing - Internal Works',
        site_address: 'Plot 88, Kawasan Perindustrian Klang, 42000 Port Klang',
        client_name: 'Logistics Hub Sdn Bhd',
        pm_phone: '+60177654321',
        pm_email: 'pm.warehouse@construct.my',
        phase: 'finishing',
        budget_variance: 1.2,
        days_behind_schedule: -3,
        start_date: '2024-01-15',
        target_completion: '2024-12-31',
      },
      created_at: '2024-01-05T08:30:00Z',
      updated_at: '2024-11-22T09:00:00Z',
    },
    {
      id: 'proj-004',
      project: {
        name: 'Hospital Expansion Wing B',
        cidb_registration: 'CIDB/G7/2023/004567',
        contract_value: 65000000,
        progress_percentage: 92,
        current_milestone: 'Testing & Commissioning',
        site_address: 'Jalan Hospital, 50586 Kuala Lumpur',
        client_name: 'Ministry of Health Malaysia',
        pm_phone: '+60163334444',
        pm_email: 'pm.hospital@healthcare.gov.my',
        phase: 'testing',
        budget_variance: -1.8,
        days_behind_schedule: 10,
        start_date: '2022-09-01',
        target_completion: '2024-11-30',
      },
      created_at: '2022-08-15T10:00:00Z',
      updated_at: '2024-11-22T11:30:00Z',
    },
    {
      id: 'proj-005',
      project: {
        name: 'Eco Business Park',
        cidb_registration: 'CIDB/G6/2024/005678',
        contract_value: 35000000,
        progress_percentage: 15,
        current_milestone: 'Mobilization Complete',
        site_address: 'Lot 999, Cyberjaya, 63000 Selangor',
        client_name: 'Eco Development Group',
        pm_phone: '+60142223333',
        pm_email: 'pm.eco@greenbuilds.my',
        phase: 'mobilization',
        budget_variance: 0,
        days_behind_schedule: 0,
        start_date: '2024-10-01',
        target_completion: '2026-03-31',
      },
      created_at: '2024-09-15T14:00:00Z',
      updated_at: '2024-11-18T16:00:00Z',
    },
    {
      id: 'proj-006',
      project: {
        name: 'Sekolah Kebangsaan Renovation',
        cidb_registration: 'CIDB/G4/2024/006789',
        contract_value: 8500000,
        progress_percentage: 75,
        current_milestone: 'MEP Installation',
        site_address: 'Jalan Pendidikan, 43000 Kajang',
        client_name: 'Kementerian Pendidikan Malaysia',
        pm_phone: '+60155556666',
        pm_email: 'pm.school@edu.gov.my',
        phase: 'mep',
        budget_variance: -3.5,
        days_behind_schedule: 8,
        start_date: '2024-04-01',
        target_completion: '2024-12-15',
      },
      created_at: '2024-03-20T13:00:00Z',
      updated_at: '2024-11-22T08:45:00Z',
    },
    {
      id: 'proj-007',
      project: {
        name: 'Luxury Condominium - The Peak',
        cidb_registration: 'CIDB/G7/2024/007890',
        contract_value: 120000000,
        progress_percentage: 45,
        current_milestone: 'Structure - Level 8',
        site_address: 'Mont Kiara, 50480 Kuala Lumpur',
        client_name: 'Peak Properties Sdn Bhd',
        pm_phone: '+60188889999',
        pm_email: 'pm.peak@luxury.my',
        phase: 'structure',
        budget_variance: 0.5,
        days_behind_schedule: 0,
        start_date: '2024-01-01',
        target_completion: '2026-06-30',
      },
      created_at: '2023-12-15T09:30:00Z',
      updated_at: '2024-11-21T15:00:00Z',
    },
    {
      id: 'proj-008',
      project: {
        name: 'Factory Building - Automotive Parts',
        cidb_registration: 'CIDB/G5/2024/008901',
        contract_value: 22000000,
        progress_percentage: 98,
        current_milestone: 'Handover Preparation',
        site_address: 'Kawasan Perindustrian Hicom, 40150 Shah Alam',
        client_name: 'AutoParts Manufacturing Sdn Bhd',
        pm_phone: '+60129998888',
        pm_email: 'pm.factory@autoparts.my',
        phase: 'handover',
        budget_variance: -0.8,
        days_behind_schedule: 0,
        start_date: '2023-11-01',
        target_completion: '2024-11-30',
      },
      created_at: '2023-10-15T11:00:00Z',
      updated_at: '2024-11-22T10:30:00Z',
    },
  ],
  summary: {
    total_projects: 24,
    total_contract_value: 458500000,
    avg_project_completion: 58.5,
    budget_variance_avg: -1.2,
    schedule_adherence: 78.5,
    safety_incidents_mtd: 2,
  },
  payment_milestones: [
    { id: 'pay-001', project_name: 'Hospital Expansion Wing B', milestone: 'Testing Complete', amount: 6500000, due_date: '2024-11-30' },
    { id: 'pay-002', project_name: 'Warehouse Complex Phase 2', milestone: 'Finishing 85%', amount: 1500000, due_date: '2024-12-05' },
    { id: 'pay-003', project_name: 'Factory Building - Automotive Parts', milestone: 'Handover', amount: 2200000, due_date: '2024-11-30' },
    { id: 'pay-004', project_name: 'Residensi Harmoni Tower A', milestone: 'Structure 65%', amount: 4500000, due_date: '2024-12-15' },
  ],
  upcoming_inspections: [
    { id: 'insp-001', project_name: 'Hospital Expansion Wing B', inspection_type: 'Final CCC Inspection', date: '2024-11-25' },
    { id: 'insp-002', project_name: 'Sekolah Kebangsaan Renovation', inspection_type: 'MEP Progress', date: '2024-11-28' },
    { id: 'insp-003', project_name: 'Factory Building - Automotive Parts', inspection_type: 'Handover Inspection', date: '2024-11-29' },
  ],
};
