// lib/verticals/mock-data/solar-data.ts
// Voltek - Solar installation mock data

export interface SolarLead {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    ic_number: string;
  };
  project: {
    system_size_kw: number;
    system_cost: number;
    panel_type: string;
    address: string;
    tnb_account: string;
    stage: string;
    inverter_model?: string;
    roof_type?: string;
  };
  payment: {
    deposit_amount: number;
    deposit_paid: number;
    balance_amount: number;
    days_overdue: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SolarSummary {
  total_leads: number;
  total_pipeline_value: number;
  total_recoverable: number;
  recovery_rate_7d: number;
  avg_days_to_payment: number;
  conversion_rate: number;
}

export interface SolarMockData {
  leads: SolarLead[];
  summary: SolarSummary;
  recent_success: Array<{ id: string; customer_name: string; amount: number; date: string }>;
  active_reminders: Array<{ id: string; customer_name: string; type: string; due_date: string }>;
}

export const solarMockData: SolarMockData = {
  leads: [
    {
      id: 'lead-001',
      customer: {
        name: 'Ahmad Razak bin Abdullah',
        phone: '+60123456789',
        email: 'ahmad.razak@email.com',
        ic_number: '850615-14-5678',
      },
      project: {
        system_size_kw: 10,
        system_cost: 45000,
        panel_type: 'Monocrystalline 450W',
        address: '123, Jalan Bukit Bintang, 55100 Kuala Lumpur',
        tnb_account: '220012345678',
        stage: 'deposit_80',
        inverter_model: 'Huawei SUN2000-10KTL',
        roof_type: 'Concrete Flat',
      },
      payment: {
        deposit_amount: 36000,
        deposit_paid: 0,
        balance_amount: 9000,
        days_overdue: 21,
      },
      created_at: '2024-10-15T08:30:00Z',
      updated_at: '2024-11-20T14:22:00Z',
    },
    {
      id: 'lead-002',
      customer: {
        name: 'Siti Nurhaliza binti Hassan',
        phone: '+60198765432',
        email: 'siti.nurhaliza@gmail.com',
        ic_number: '880923-08-1234',
      },
      project: {
        system_size_kw: 8,
        system_cost: 38000,
        panel_type: 'Monocrystalline 400W',
        address: '45, Taman Sri Hartamas, 50480 Kuala Lumpur',
        tnb_account: '220098765432',
        stage: 'balance_20',
        inverter_model: 'Growatt MIN 8000TL-X',
        roof_type: 'Metal Deck',
      },
      payment: {
        deposit_amount: 30400,
        deposit_paid: 30400,
        balance_amount: 7600,
        days_overdue: 14,
      },
      created_at: '2024-09-28T10:15:00Z',
      updated_at: '2024-11-18T09:45:00Z',
    },
    {
      id: 'lead-003',
      customer: {
        name: 'Tan Wei Ming',
        phone: '+60177654321',
        email: 'weiming.tan@company.my',
        ic_number: '780412-10-5566',
      },
      project: {
        system_size_kw: 15,
        system_cost: 65000,
        panel_type: 'Bifacial 550W',
        address: '88, Persiaran Kewajipan, USJ 1, 47600 Subang Jaya',
        tnb_account: '220055667788',
        stage: 'site_visit',
        inverter_model: 'SolarEdge SE15K',
        roof_type: 'Concrete Tiles',
      },
      payment: {
        deposit_amount: 52000,
        deposit_paid: 0,
        balance_amount: 13000,
        days_overdue: 0,
      },
      created_at: '2024-11-20T14:00:00Z',
      updated_at: '2024-11-22T16:30:00Z',
    },
    {
      id: 'lead-004',
      customer: {
        name: 'Rajesh Kumar a/l Muthu',
        phone: '+60163334444',
        email: 'rajesh.kumar@email.com',
        ic_number: '910718-02-3344',
      },
      project: {
        system_size_kw: 6,
        system_cost: 28000,
        panel_type: 'Polycrystalline 330W',
        address: '12, Jalan Ipoh, 51200 Kuala Lumpur',
        tnb_account: '220033445566',
        stage: 'installation',
        inverter_model: 'Sungrow SG6.0RT',
        roof_type: 'Clay Tiles',
      },
      payment: {
        deposit_amount: 22400,
        deposit_paid: 22400,
        balance_amount: 5600,
        days_overdue: 0,
      },
      created_at: '2024-10-05T11:20:00Z',
      updated_at: '2024-11-21T08:00:00Z',
    },
    {
      id: 'lead-005',
      customer: {
        name: 'Nor Azizah binti Osman',
        phone: '+60142223333',
        email: 'azizah.osman@gmail.com',
        ic_number: '820505-06-7788',
      },
      project: {
        system_size_kw: 12,
        system_cost: 52000,
        panel_type: 'Monocrystalline 450W',
        address: '67, Bandar Kinrara, 47100 Puchong',
        tnb_account: '220077889900',
        stage: 'quotation',
        inverter_model: 'Huawei SUN2000-12KTL',
        roof_type: 'Concrete Flat',
      },
      payment: {
        deposit_amount: 41600,
        deposit_paid: 0,
        balance_amount: 10400,
        days_overdue: 0,
      },
      created_at: '2024-11-18T09:00:00Z',
      updated_at: '2024-11-22T11:30:00Z',
    },
    {
      id: 'lead-006',
      customer: {
        name: 'Lim Chee Keong',
        phone: '+60155556666',
        email: 'ck.lim@business.com',
        ic_number: '750830-04-2211',
      },
      project: {
        system_size_kw: 20,
        system_cost: 85000,
        panel_type: 'Bifacial 550W',
        address: '99, Jalan Sultan Ismail, 50250 Kuala Lumpur',
        tnb_account: '220011223344',
        stage: 'tnb_approval',
        inverter_model: 'SMA Tripower 20000TL',
        roof_type: 'Metal Deck',
      },
      payment: {
        deposit_amount: 68000,
        deposit_paid: 68000,
        balance_amount: 17000,
        days_overdue: 0,
      },
      created_at: '2024-09-10T07:45:00Z',
      updated_at: '2024-11-15T13:20:00Z',
    },
    {
      id: 'lead-007',
      customer: {
        name: 'Fatimah Zahra binti Ismail',
        phone: '+60188889999',
        email: 'fatimah.zahra@email.my',
        ic_number: '950210-01-6677',
      },
      project: {
        system_size_kw: 5,
        system_cost: 24000,
        panel_type: 'Monocrystalline 400W',
        address: '23, Taman Melawati, 53100 Kuala Lumpur',
        tnb_account: '220066778899',
        stage: 'completed',
        inverter_model: 'Growatt MIN 5000TL-X',
        roof_type: 'Concrete Tiles',
      },
      payment: {
        deposit_amount: 19200,
        deposit_paid: 19200,
        balance_amount: 4800,
        days_overdue: 0,
      },
      created_at: '2024-08-01T13:00:00Z',
      updated_at: '2024-10-25T16:00:00Z',
    },
    {
      id: 'lead-008',
      customer: {
        name: 'Mohamed Faizal bin Yusof',
        phone: '+60129998888',
        email: 'faizal.yusof@gmail.com',
        ic_number: '880115-05-4455',
      },
      project: {
        system_size_kw: 7,
        system_cost: 32000,
        panel_type: 'Monocrystalline 450W',
        address: '56, Seksyen 7, 40000 Shah Alam',
        tnb_account: '220044556677',
        stage: 'deposit_80',
        inverter_model: 'Sungrow SG8.0RT',
        roof_type: 'Clay Tiles',
      },
      payment: {
        deposit_amount: 25600,
        deposit_paid: 0,
        balance_amount: 6400,
        days_overdue: 8,
      },
      created_at: '2024-11-01T10:30:00Z',
      updated_at: '2024-11-20T11:15:00Z',
    },
  ],
  summary: {
    total_leads: 156,
    total_pipeline_value: 3130000,
    total_recoverable: 180400,
    recovery_rate_7d: 68.5,
    avg_days_to_payment: 18,
    conversion_rate: 22.5,
  },
  recent_success: [
    { id: 'lead-007', customer_name: 'Fatimah Zahra binti Ismail', amount: 4800, date: '2024-10-25' },
    { id: 'lead-010', customer_name: 'Chong Wei Seng', amount: 9200, date: '2024-10-22' },
    { id: 'lead-015', customer_name: 'Aisha binti Karim', amount: 6800, date: '2024-10-20' },
  ],
  active_reminders: [
    { id: 'rem-001', customer_name: 'Ahmad Razak bin Abdullah', type: 'payment_80', due_date: '2024-11-25' },
    { id: 'rem-002', customer_name: 'Siti Nurhaliza binti Hassan', type: 'payment_20', due_date: '2024-11-23' },
    { id: 'rem-003', customer_name: 'Mohamed Faizal bin Yusof', type: 'payment_80', due_date: '2024-11-28' },
  ],
};
