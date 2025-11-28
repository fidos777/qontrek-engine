// lib/verticals/mock-data/training-data.ts
// HRDC - Training and certification mock data

export interface TrainingEnrollment {
  id: string;
  participant: {
    name: string;
    phone: string;
    email: string;
    ic_number: string;
    company_name: string;
  };
  course: {
    name: string;
    training_hours: number;
    certification_level: string;
    start_date: string;
    end_date: string;
  };
  enrollment: {
    course_fee: number;
    hrdc_claim_number: string | null;
    status: string;
    assessment_score: number | null;
    days_since_registration: number;
    payment_status: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TrainingSummary {
  total_participants: number;
  enrollment_rate: number;
  completion_rate: number;
  certification_pass_rate: number;
  hrdc_claim_rate: number;
  total_training_hours: number;
}

export interface TrainingMockData {
  enrollments: TrainingEnrollment[];
  summary: TrainingSummary;
  upcoming_classes: Array<{ course_name: string; date: string; venue: string; enrolled: number; capacity: number }>;
  pending_certifications: Array<{ id: string; participant_name: string; course_name: string; completion_date: string }>;
}

export const trainingMockData: TrainingMockData = {
  enrollments: [
    {
      id: 'enr-001',
      participant: {
        name: 'Ahmad Firdaus bin Kamal',
        phone: '+60123456789',
        email: 'firdaus.kamal@company.my',
        ic_number: '880515-14-5678',
        company_name: 'TechCorp Sdn Bhd',
      },
      course: {
        name: 'Project Management Professional (PMP)',
        training_hours: 35,
        certification_level: 'Professional',
        start_date: '2024-11-25',
        end_date: '2024-11-29',
      },
      enrollment: {
        course_fee: 3500,
        hrdc_claim_number: 'HRDC-2024-12345',
        status: 'enrolled',
        assessment_score: null,
        days_since_registration: 10,
        payment_status: 'paid',
      },
      created_at: '2024-11-12T09:00:00Z',
      updated_at: '2024-11-20T14:30:00Z',
    },
    {
      id: 'enr-002',
      participant: {
        name: 'Nurul Ain binti Hassan',
        phone: '+60198765432',
        email: 'nurul.ain@email.com',
        ic_number: '920712-08-2345',
        company_name: 'Global Solutions Bhd',
      },
      course: {
        name: 'Digital Marketing Fundamentals',
        training_hours: 16,
        certification_level: 'Foundation',
        start_date: '2024-11-20',
        end_date: '2024-11-21',
      },
      enrollment: {
        course_fee: 1200,
        hrdc_claim_number: 'HRDC-2024-12456',
        status: 'in_progress',
        assessment_score: null,
        days_since_registration: 15,
        payment_status: 'paid',
      },
      created_at: '2024-11-07T11:00:00Z',
      updated_at: '2024-11-20T08:30:00Z',
    },
    {
      id: 'enr-003',
      participant: {
        name: 'Lim Boon Keat',
        phone: '+60177654321',
        email: 'boonkeat.lim@corp.my',
        ic_number: '850805-10-6789',
        company_name: 'Infinity Systems Sdn Bhd',
      },
      course: {
        name: 'AWS Solutions Architect',
        training_hours: 40,
        certification_level: 'Associate',
        start_date: '2024-11-18',
        end_date: '2024-11-22',
      },
      enrollment: {
        course_fee: 4500,
        hrdc_claim_number: 'HRDC-2024-12567',
        status: 'assessment',
        assessment_score: null,
        days_since_registration: 20,
        payment_status: 'paid',
      },
      created_at: '2024-11-02T08:30:00Z',
      updated_at: '2024-11-22T10:00:00Z',
    },
    {
      id: 'enr-004',
      participant: {
        name: 'Muthu a/l Ramasamy',
        phone: '+60163334444',
        email: 'muthu.r@company.my',
        ic_number: '900318-02-4567',
        company_name: 'Premier Manufacturing Sdn Bhd',
      },
      course: {
        name: 'Lean Six Sigma Green Belt',
        training_hours: 24,
        certification_level: 'Intermediate',
        start_date: '2024-12-02',
        end_date: '2024-12-04',
      },
      enrollment: {
        course_fee: 2800,
        hrdc_claim_number: null,
        status: 'payment_pending',
        assessment_score: null,
        days_since_registration: 5,
        payment_status: 'pending',
      },
      created_at: '2024-11-17T10:00:00Z',
      updated_at: '2024-11-22T09:00:00Z',
    },
    {
      id: 'enr-005',
      participant: {
        name: 'Fatimah binti Ismail',
        phone: '+60142223333',
        email: 'fatimah.i@email.my',
        ic_number: '880915-06-8901',
        company_name: 'Healthcare Plus Sdn Bhd',
      },
      course: {
        name: 'Leadership & Management',
        training_hours: 16,
        certification_level: 'Professional',
        start_date: '2024-11-11',
        end_date: '2024-11-12',
      },
      enrollment: {
        course_fee: 1800,
        hrdc_claim_number: 'HRDC-2024-11234',
        status: 'certified',
        assessment_score: 85,
        days_since_registration: 25,
        payment_status: 'paid',
      },
      created_at: '2024-10-28T14:00:00Z',
      updated_at: '2024-11-15T16:30:00Z',
    },
    {
      id: 'enr-006',
      participant: {
        name: 'Ng Chee Wai',
        phone: '+60155556666',
        email: 'cheewai.ng@business.com',
        ic_number: '870422-04-3456',
        company_name: 'Finance First Bhd',
      },
      course: {
        name: 'Financial Analysis & Reporting',
        training_hours: 24,
        certification_level: 'Professional',
        start_date: '2024-11-04',
        end_date: '2024-11-06',
      },
      enrollment: {
        course_fee: 2500,
        hrdc_claim_number: 'HRDC-2024-10987',
        status: 'certificate_issued',
        assessment_score: 92,
        days_since_registration: 30,
        payment_status: 'paid',
      },
      created_at: '2024-10-23T13:00:00Z',
      updated_at: '2024-11-12T11:00:00Z',
    },
    {
      id: 'enr-007',
      participant: {
        name: 'Siti Mariam binti Yusof',
        phone: '+60188889999',
        email: 'mariam.yusof@gmail.com',
        ic_number: '950605-01-7890',
        company_name: 'Retail Masters Sdn Bhd',
      },
      course: {
        name: 'Customer Service Excellence',
        training_hours: 8,
        certification_level: 'Foundation',
        start_date: '2024-11-28',
        end_date: '2024-11-28',
      },
      enrollment: {
        course_fee: 800,
        hrdc_claim_number: null,
        status: 'registration',
        assessment_score: null,
        days_since_registration: 2,
        payment_status: 'unpaid',
      },
      created_at: '2024-11-20T09:30:00Z',
      updated_at: '2024-11-20T09:30:00Z',
    },
    {
      id: 'enr-008',
      participant: {
        name: 'Rajesh a/l Kumar',
        phone: '+60129998888',
        email: 'rajesh.kumar@tech.my',
        ic_number: '830210-05-2345',
        company_name: 'Digital Dynamics Sdn Bhd',
      },
      course: {
        name: 'Cybersecurity Fundamentals',
        training_hours: 32,
        certification_level: 'Foundation',
        start_date: '2024-11-25',
        end_date: '2024-11-28',
      },
      enrollment: {
        course_fee: 3200,
        hrdc_claim_number: 'HRDC-2024-12678',
        status: 'enrolled',
        assessment_score: null,
        days_since_registration: 8,
        payment_status: 'paid',
      },
      created_at: '2024-11-14T11:00:00Z',
      updated_at: '2024-11-20T15:00:00Z',
    },
  ],
  summary: {
    total_participants: 156,
    enrollment_rate: 78.5,
    completion_rate: 94.2,
    certification_pass_rate: 88.5,
    hrdc_claim_rate: 72.3,
    total_training_hours: 4520,
  },
  upcoming_classes: [
    { course_name: 'Project Management Professional (PMP)', date: '2024-11-25', venue: 'Training Center KL', enrolled: 15, capacity: 20 },
    { course_name: 'Cybersecurity Fundamentals', date: '2024-11-25', venue: 'Tech Hub PJ', enrolled: 18, capacity: 25 },
    { course_name: 'Customer Service Excellence', date: '2024-11-28', venue: 'Training Center KL', enrolled: 12, capacity: 30 },
    { course_name: 'Lean Six Sigma Green Belt', date: '2024-12-02', venue: 'Industrial Park Shah Alam', enrolled: 8, capacity: 15 },
  ],
  pending_certifications: [
    { id: 'enr-003', participant_name: 'Lim Boon Keat', course_name: 'AWS Solutions Architect', completion_date: '2024-11-22' },
    { id: 'enr-010', participant_name: 'Wong Mei Ling', course_name: 'Digital Marketing Fundamentals', completion_date: '2024-11-21' },
    { id: 'enr-012', participant_name: 'Amirul Hakim', course_name: 'Leadership & Management', completion_date: '2024-11-19' },
  ],
};
