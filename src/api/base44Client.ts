// Mock API client for DPC practices
// In a real application, this would connect to an actual backend

export interface DPCPractice {
  id: string;
  practice_name: string;
  city: string;
  state: string;
  address?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  provider_name?: string;
  accepts_insurance: boolean;
  practice_type?: 'dpc_only' | 'hybrid_dpc';
  patient_capacity?: 'accepting_new' | 'limited_capacity' | 'full';
  membership_fee_min?: number;
  membership_fee_max?: number;
  services_offered?: string[];
  verified: boolean;
  created_date: string;
}

// Mock data for demonstration
const mockPractices: DPCPractice[] = [
  {
    id: '1',
    practice_name: 'HealthFirst Direct Care',
    city: 'Austin',
    state: 'TX',
    address: '123 Main St',
    zip_code: '78701',
    phone: '(512) 555-0100',
    email: 'info@healthfirst.com',
    website: 'https://healthfirst.com',
    provider_name: 'Dr. Sarah Johnson',
    accepts_insurance: false,
    practice_type: 'dpc_only',
    patient_capacity: 'accepting_new',
    membership_fee_min: 75,
    membership_fee_max: 150,
    services_offered: ['Primary Care', 'Telemedicine', 'Lab Services', 'Preventive Care'],
    verified: true,
    created_date: new Date().toISOString(),
  },
  {
    id: '2',
    practice_name: 'Wellness Direct Medicine',
    city: 'Seattle',
    state: 'WA',
    address: '456 Pine Ave',
    zip_code: '98101',
    phone: '(206) 555-0200',
    email: 'contact@wellnessdirect.com',
    website: 'https://wellnessdirect.com',
    provider_name: 'Dr. Michael Chen',
    accepts_insurance: true,
    practice_type: 'hybrid_dpc',
    patient_capacity: 'limited_capacity',
    membership_fee_min: 100,
    membership_fee_max: 200,
    services_offered: ['Primary Care', 'Telemedicine', 'Chronic Disease Management', 'Mental Health'],
    verified: true,
    created_date: new Date().toISOString(),
  },
  {
    id: '3',
    practice_name: 'Care Direct Family Practice',
    city: 'Denver',
    state: 'CO',
    address: '789 Oak Rd',
    zip_code: '80202',
    phone: '(303) 555-0300',
    email: 'hello@caredirect.com',
    website: 'https://caredirect.com',
    provider_name: 'Dr. Emily Rodriguez',
    accepts_insurance: false,
    practice_type: 'dpc_only',
    patient_capacity: 'accepting_new',
    membership_fee_min: 50,
    membership_fee_max: 125,
    services_offered: ['Primary Care', 'Pediatrics', 'Women\'s Health', 'Preventive Care', 'Lab Services'],
    verified: true,
    created_date: new Date().toISOString(),
  },
];

class Base44Client {
  entities = {
    DPCPractice: {
      list: async (orderBy: string, limit: number): Promise<DPCPractice[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockPractices;
      },
    },
  };
}

export const base44 = new Base44Client();
