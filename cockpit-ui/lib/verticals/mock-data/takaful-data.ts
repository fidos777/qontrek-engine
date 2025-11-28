// lib/verticals/mock-data/takaful-data.ts
// GFR - Islamic insurance/takaful mock data

export interface TakafulPolicy {
  id: string;
  policyholder: {
    name: string;
    phone: string;
    email: string;
    ic_number: string;
  };
  policy: {
    policy_number: string;
    product_type: string;
    coverage_amount: number;
    premium_amount: number;
    beneficiary: string;
    status: string;
    start_date: string;
    expiry_date: string;
    days_overdue: number;
  };
  claim?: {
    claim_number: string;
    claim_amount: number;
    status: string;
    filed_date: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TakafulSummary {
  total_policies: number;
  total_premiums_collected: number;
  pending_claims_value: number;
  claims_ratio: number;
  renewal_rate: number;
  avg_claim_processing_time: number;
}

export interface TakafulMockData {
  policies: TakafulPolicy[];
  summary: TakafulSummary;
  pending_claims: Array<{ id: string; policyholder: string; amount: number; filed_date: string; status: string }>;
  renewal_due: Array<{ id: string; policyholder: string; policy_number: string; expiry_date: string }>;
}

export const takafulMockData: TakafulMockData = {
  policies: [
    {
      id: 'pol-001',
      policyholder: {
        name: 'Mohd Hafiz bin Razali',
        phone: '+60123456789',
        email: 'hafiz.razali@email.com',
        ic_number: '850420-14-5678',
      },
      policy: {
        policy_number: 'TAK-2024-001234',
        product_type: 'Family Takaful',
        coverage_amount: 200000,
        premium_amount: 250,
        beneficiary: 'Nur Aisyah binti Mohd Hafiz',
        status: 'active',
        start_date: '2024-01-15',
        expiry_date: '2025-01-14',
        days_overdue: 0,
      },
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-11-20T10:30:00Z',
    },
    {
      id: 'pol-002',
      policyholder: {
        name: 'Nurul Huda binti Ahmad',
        phone: '+60198765432',
        email: 'nurul.huda@gmail.com',
        ic_number: '880712-08-2345',
      },
      policy: {
        policy_number: 'TAK-2024-001456',
        product_type: 'Medical Takaful',
        coverage_amount: 150000,
        premium_amount: 180,
        beneficiary: 'Self',
        status: 'claim_processing',
        start_date: '2024-03-01',
        expiry_date: '2025-02-28',
        days_overdue: 0,
      },
      claim: {
        claim_number: 'CLM-2024-00456',
        claim_amount: 8500,
        status: 'processing',
        filed_date: '2024-11-10',
      },
      created_at: '2024-02-25T11:00:00Z',
      updated_at: '2024-11-18T14:15:00Z',
    },
    {
      id: 'pol-003',
      policyholder: {
        name: 'Wong Kah Chun',
        phone: '+60177654321',
        email: 'kahchun.wong@company.my',
        ic_number: '790805-10-6789',
      },
      policy: {
        policy_number: 'TAK-2023-008765',
        product_type: 'Investment-Linked Takaful',
        coverage_amount: 500000,
        premium_amount: 500,
        beneficiary: 'Wong Mei Ling',
        status: 'renewal_due',
        start_date: '2023-12-01',
        expiry_date: '2024-11-30',
        days_overdue: 15,
      },
      created_at: '2023-11-20T08:30:00Z',
      updated_at: '2024-11-15T09:00:00Z',
    },
    {
      id: 'pol-004',
      policyholder: {
        name: 'Suresh a/l Krishnan',
        phone: '+60163334444',
        email: 'suresh.k@email.com',
        ic_number: '920318-02-4567',
      },
      policy: {
        policy_number: 'TAK-2024-002345',
        product_type: 'Motor Takaful',
        coverage_amount: 80000,
        premium_amount: 1200,
        beneficiary: 'Self',
        status: 'active',
        start_date: '2024-06-01',
        expiry_date: '2025-05-31',
        days_overdue: 0,
      },
      created_at: '2024-05-25T10:00:00Z',
      updated_at: '2024-06-01T09:30:00Z',
    },
    {
      id: 'pol-005',
      policyholder: {
        name: 'Azizah binti Mohamed',
        phone: '+60142223333',
        email: 'azizah.m@gmail.com',
        ic_number: '820915-06-8901',
      },
      policy: {
        policy_number: 'TAK-2024-003456',
        product_type: 'Family Takaful',
        coverage_amount: 300000,
        premium_amount: 350,
        beneficiary: 'Multiple',
        status: 'claim_paid',
        start_date: '2024-02-15',
        expiry_date: '2025-02-14',
        days_overdue: 0,
      },
      claim: {
        claim_number: 'CLM-2024-00234',
        claim_amount: 25000,
        status: 'paid',
        filed_date: '2024-09-05',
      },
      created_at: '2024-02-10T14:00:00Z',
      updated_at: '2024-10-15T11:30:00Z',
    },
    {
      id: 'pol-006',
      policyholder: {
        name: 'Liew Mei Fong',
        phone: '+60155556666',
        email: 'meifong.liew@business.com',
        ic_number: '760422-04-3456',
      },
      policy: {
        policy_number: 'TAK-2024-004567',
        product_type: 'Education Takaful',
        coverage_amount: 100000,
        premium_amount: 200,
        beneficiary: 'Liew Jun Wei',
        status: 'active',
        start_date: '2024-04-01',
        expiry_date: '2034-03-31',
        days_overdue: 0,
      },
      created_at: '2024-03-25T13:00:00Z',
      updated_at: '2024-04-01T10:00:00Z',
    },
    {
      id: 'pol-007',
      policyholder: {
        name: 'Ismail bin Hassan',
        phone: '+60188889999',
        email: 'ismail.hassan@email.my',
        ic_number: '940605-01-7890',
      },
      policy: {
        policy_number: 'TAK-2024-005678',
        product_type: 'Medical Takaful',
        coverage_amount: 200000,
        premium_amount: 220,
        beneficiary: 'Self',
        status: 'claim_filed',
        start_date: '2024-05-15',
        expiry_date: '2025-05-14',
        days_overdue: 0,
      },
      claim: {
        claim_number: 'CLM-2024-00567',
        claim_amount: 12000,
        status: 'filed',
        filed_date: '2024-11-20',
      },
      created_at: '2024-05-10T09:30:00Z',
      updated_at: '2024-11-20T15:45:00Z',
    },
    {
      id: 'pol-008',
      policyholder: {
        name: 'Tan Siew Ling',
        phone: '+60129998888',
        email: 'siewling.tan@gmail.com',
        ic_number: '870210-05-2345',
      },
      policy: {
        policy_number: 'TAK-2023-006789',
        product_type: 'Family Takaful',
        coverage_amount: 250000,
        premium_amount: 300,
        beneficiary: 'Tan Family',
        status: 'renewal_due',
        start_date: '2023-11-15',
        expiry_date: '2024-11-14',
        days_overdue: 8,
      },
      created_at: '2023-11-10T11:00:00Z',
      updated_at: '2024-11-10T08:30:00Z',
    },
  ],
  summary: {
    total_policies: 2456,
    total_premiums_collected: 485000,
    pending_claims_value: 125500,
    claims_ratio: 58.5,
    renewal_rate: 82.3,
    avg_claim_processing_time: 8,
  },
  pending_claims: [
    { id: 'CLM-2024-00456', policyholder: 'Nurul Huda binti Ahmad', amount: 8500, filed_date: '2024-11-10', status: 'processing' },
    { id: 'CLM-2024-00567', policyholder: 'Ismail bin Hassan', amount: 12000, filed_date: '2024-11-20', status: 'filed' },
    { id: 'CLM-2024-00678', policyholder: 'Ahmad Rizal bin Kamal', amount: 5500, filed_date: '2024-11-18', status: 'processing' },
  ],
  renewal_due: [
    { id: 'pol-003', policyholder: 'Wong Kah Chun', policy_number: 'TAK-2023-008765', expiry_date: '2024-11-30' },
    { id: 'pol-008', policyholder: 'Tan Siew Ling', policy_number: 'TAK-2023-006789', expiry_date: '2024-11-14' },
    { id: 'pol-015', policyholder: 'Farah binti Jamal', policy_number: 'TAK-2023-009876', expiry_date: '2024-12-05' },
  ],
};
