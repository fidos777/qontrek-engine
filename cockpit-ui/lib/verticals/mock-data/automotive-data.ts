// lib/verticals/mock-data/automotive-data.ts
// Perodua - Automotive services mock data

export interface AutomotiveService {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    registration_number: string;
    model: string;
    mileage: number;
  };
  service: {
    job_card_number: string;
    service_type: string;
    total_cost: number;
    status: string;
    technician_name: string;
    days_in_workshop: number;
    check_in_date: string;
    estimated_completion: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AutomotiveSummary {
  daily_jobs_completed: number;
  daily_revenue: number;
  avg_turnaround_time: number;
  customer_satisfaction: number;
  parts_availability: number;
  vehicles_in_workshop: number;
}

export interface AutomotiveMockData {
  services: AutomotiveService[];
  summary: AutomotiveSummary;
  todays_bookings: Array<{ id: string; customer_name: string; vehicle_number: string; time: string; service_type: string }>;
  pending_parts: Array<{ id: string; vehicle_number: string; part_name: string; eta: string }>;
}

export const automotiveMockData: AutomotiveMockData = {
  services: [
    {
      id: 'svc-001',
      customer: {
        name: 'Mohd Azmi bin Ismail',
        phone: '+60123456789',
        email: 'azmi.ismail@email.com',
      },
      vehicle: {
        registration_number: 'WA 1234 B',
        model: 'Perodua Myvi 1.5 AV',
        mileage: 45000,
      },
      service: {
        job_card_number: 'JC-2024-11220001',
        service_type: '40,000km Service',
        total_cost: 450.00,
        status: 'in_repair',
        technician_name: 'Ahmad Farid',
        days_in_workshop: 1,
        check_in_date: '2024-11-21T08:30:00Z',
        estimated_completion: '2024-11-22T16:00:00Z',
      },
      created_at: '2024-11-21T08:30:00Z',
      updated_at: '2024-11-22T10:00:00Z',
    },
    {
      id: 'svc-002',
      customer: {
        name: 'Tan Mei Ling',
        phone: '+60198765432',
        email: 'meiling.tan@gmail.com',
      },
      vehicle: {
        registration_number: 'BJK 5678',
        model: 'Perodua Axia 1.0 SE',
        mileage: 28000,
      },
      service: {
        job_card_number: 'JC-2024-11220002',
        service_type: 'Brake Pad Replacement',
        total_cost: 380.00,
        status: 'quality_check',
        technician_name: 'Raju a/l Subramaniam',
        days_in_workshop: 1,
        check_in_date: '2024-11-21T09:15:00Z',
        estimated_completion: '2024-11-22T14:00:00Z',
      },
      created_at: '2024-11-21T09:15:00Z',
      updated_at: '2024-11-22T11:30:00Z',
    },
    {
      id: 'svc-003',
      customer: {
        name: 'Siti Aminah binti Yusof',
        phone: '+60177654321',
        email: 'aminah.yusof@company.my',
      },
      vehicle: {
        registration_number: 'WKL 9012',
        model: 'Perodua Aruz 1.5 AV',
        mileage: 62000,
      },
      service: {
        job_card_number: 'JC-2024-11220003',
        service_type: '60,000km Major Service',
        total_cost: 850.00,
        status: 'ready',
        technician_name: 'Mohd Hafiz',
        days_in_workshop: 2,
        check_in_date: '2024-11-20T10:00:00Z',
        estimated_completion: '2024-11-22T12:00:00Z',
      },
      created_at: '2024-11-20T10:00:00Z',
      updated_at: '2024-11-22T12:00:00Z',
    },
    {
      id: 'svc-004',
      customer: {
        name: 'Kumar a/l Krishnan',
        phone: '+60163334444',
        email: 'kumar.k@email.com',
      },
      vehicle: {
        registration_number: 'VDP 3456',
        model: 'Perodua Bezza 1.3 X',
        mileage: 15000,
      },
      service: {
        job_card_number: 'JC-2024-11220004',
        service_type: '10,000km Service',
        total_cost: 280.00,
        status: 'check_in',
        technician_name: 'Pending Assignment',
        days_in_workshop: 0,
        check_in_date: '2024-11-22T08:00:00Z',
        estimated_completion: '2024-11-22T17:00:00Z',
      },
      created_at: '2024-11-22T08:00:00Z',
      updated_at: '2024-11-22T08:00:00Z',
    },
    {
      id: 'svc-005',
      customer: {
        name: 'Noraini binti Hassan',
        phone: '+60142223333',
        email: 'noraini.h@gmail.com',
      },
      vehicle: {
        registration_number: 'WQS 7890',
        model: 'Perodua Alza 1.5 AV',
        mileage: 95000,
      },
      service: {
        job_card_number: 'JC-2024-11220005',
        service_type: 'CVT Fluid Change',
        total_cost: 520.00,
        status: 'parts_ordering',
        technician_name: 'Wong Chee Keong',
        days_in_workshop: 2,
        check_in_date: '2024-11-20T14:30:00Z',
        estimated_completion: '2024-11-23T16:00:00Z',
      },
      created_at: '2024-11-20T14:30:00Z',
      updated_at: '2024-11-22T09:00:00Z',
    },
    {
      id: 'svc-006',
      customer: {
        name: 'Lee Wei Keat',
        phone: '+60155556666',
        email: 'weikeat.lee@business.com',
      },
      vehicle: {
        registration_number: 'PMC 1122',
        model: 'Perodua Ativa 1.0 Turbo AV',
        mileage: 32000,
      },
      service: {
        job_card_number: 'JC-2024-11210012',
        service_type: '30,000km Service',
        total_cost: 420.00,
        status: 'collected',
        technician_name: 'Ahmad Farid',
        days_in_workshop: 1,
        check_in_date: '2024-11-21T11:00:00Z',
        estimated_completion: '2024-11-22T10:00:00Z',
      },
      created_at: '2024-11-21T11:00:00Z',
      updated_at: '2024-11-22T10:30:00Z',
    },
    {
      id: 'svc-007',
      customer: {
        name: 'Farah binti Abdullah',
        phone: '+60188889999',
        email: 'farah.abdullah@email.my',
      },
      vehicle: {
        registration_number: 'WYT 4455',
        model: 'Perodua Myvi 1.3 G',
        mileage: 78000,
      },
      service: {
        job_card_number: 'JC-2024-11220006',
        service_type: 'Air Conditioning Service',
        total_cost: 350.00,
        status: 'diagnosis',
        technician_name: 'Mohd Hafiz',
        days_in_workshop: 0,
        check_in_date: '2024-11-22T09:30:00Z',
        estimated_completion: '2024-11-22T16:00:00Z',
      },
      created_at: '2024-11-22T09:30:00Z',
      updated_at: '2024-11-22T10:15:00Z',
    },
    {
      id: 'svc-008',
      customer: {
        name: 'Ramesh a/l Muthu',
        phone: '+60129998888',
        email: 'ramesh.m@gmail.com',
      },
      vehicle: {
        registration_number: 'BCQ 6677',
        model: 'Perodua Bezza 1.0 G',
        mileage: 55000,
      },
      service: {
        job_card_number: 'JC-2024-11220007',
        service_type: '50,000km Service + Timing Belt',
        total_cost: 980.00,
        status: 'quotation_approval',
        technician_name: 'Raju a/l Subramaniam',
        days_in_workshop: 1,
        check_in_date: '2024-11-21T15:00:00Z',
        estimated_completion: '2024-11-23T17:00:00Z',
      },
      created_at: '2024-11-21T15:00:00Z',
      updated_at: '2024-11-22T08:30:00Z',
    },
  ],
  summary: {
    daily_jobs_completed: 18,
    daily_revenue: 12450.00,
    avg_turnaround_time: 1.2,
    customer_satisfaction: 4.6,
    parts_availability: 92.5,
    vehicles_in_workshop: 12,
  },
  todays_bookings: [
    { id: 'book-001', customer_name: 'Ahmad Zulkifli', vehicle_number: 'WRN 8899', time: '10:00', service_type: '20,000km Service' },
    { id: 'book-002', customer_name: 'Lim Siew Chin', vehicle_number: 'PJK 2233', time: '11:30', service_type: 'Battery Replacement' },
    { id: 'book-003', customer_name: 'Nurul Izzah', vehicle_number: 'WHB 4455', time: '14:00', service_type: 'Tyre Replacement' },
    { id: 'book-004', customer_name: 'Ganesh a/l Raman', vehicle_number: 'BKE 6677', time: '15:30', service_type: '40,000km Service' },
  ],
  pending_parts: [
    { id: 'part-001', vehicle_number: 'WQS 7890', part_name: 'CVT Fluid Type-4', eta: '2024-11-23' },
    { id: 'part-002', vehicle_number: 'BCQ 6677', part_name: 'Timing Belt Kit', eta: '2024-11-23' },
    { id: 'part-003', vehicle_number: 'WMK 1234', part_name: 'Front Shock Absorber', eta: '2024-11-25' },
  ],
};
