// lib/verticals/mock-data/ecommerce-data.ts
// Nexora - E-commerce operations mock data

export interface EcommerceOrder {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  order: {
    order_id: string;
    total_amount: number;
    cart_items: number;
    shipping_address: string;
    tracking_number: string | null;
    payment_method: string;
    courier: string | null;
    status: string;
    days_since_order: number;
  };
  created_at: string;
  updated_at: string;
}

export interface EcommerceSummary {
  total_orders_today: number;
  total_revenue_today: number;
  cart_abandonment_rate: number;
  avg_fulfillment_time: number;
  return_rate: number;
  pending_shipments: number;
}

export interface EcommerceMockData {
  orders: EcommerceOrder[];
  summary: EcommerceSummary;
  abandoned_carts: Array<{ id: string; customer_name: string; cart_value: number; abandoned_at: string }>;
  pending_shipments: Array<{ id: string; customer_name: string; order_id: string; days_pending: number }>;
}

export const ecommerceMockData: EcommerceMockData = {
  orders: [
    {
      id: 'ord-001',
      customer: {
        name: 'Amirah binti Zainal',
        phone: '+60123456789',
        email: 'amirah.z@email.com',
      },
      order: {
        order_id: 'NXR-20241122-001',
        total_amount: 289.90,
        cart_items: 3,
        shipping_address: '45, Jalan Ampang, 50450 Kuala Lumpur',
        tracking_number: 'JNTMY12345678',
        payment_method: 'FPX',
        courier: 'J&T Express',
        status: 'shipped',
        days_since_order: 2,
      },
      created_at: '2024-11-20T14:30:00Z',
      updated_at: '2024-11-22T09:00:00Z',
    },
    {
      id: 'ord-002',
      customer: {
        name: 'Kevin Ng Wei Jie',
        phone: '+60198765432',
        email: 'kevin.ng@gmail.com',
      },
      order: {
        order_id: 'NXR-20241122-002',
        total_amount: 599.00,
        cart_items: 2,
        shipping_address: '12, Persiaran Tropicana, 47410 Petaling Jaya',
        tracking_number: null,
        payment_method: 'Credit Card',
        courier: null,
        status: 'processing',
        days_since_order: 1,
      },
      created_at: '2024-11-21T10:15:00Z',
      updated_at: '2024-11-22T08:30:00Z',
    },
    {
      id: 'ord-003',
      customer: {
        name: 'Priya a/p Raman',
        phone: '+60177654321',
        email: 'priya.raman@company.my',
      },
      order: {
        order_id: 'NXR-20241121-015',
        total_amount: 156.50,
        cart_items: 4,
        shipping_address: '88, Jalan SS2/24, 47300 Petaling Jaya',
        tracking_number: 'POSLAJU87654321',
        payment_method: 'E-Wallet',
        courier: 'Pos Laju',
        status: 'out_for_delivery',
        days_since_order: 3,
      },
      created_at: '2024-11-19T16:45:00Z',
      updated_at: '2024-11-22T07:30:00Z',
    },
    {
      id: 'ord-004',
      customer: {
        name: 'Hassan bin Othman',
        phone: '+60163334444',
        email: 'hassan.o@email.com',
      },
      order: {
        order_id: 'NXR-20241122-003',
        total_amount: 89.90,
        cart_items: 1,
        shipping_address: '23, Taman Desa, 58100 Kuala Lumpur',
        tracking_number: null,
        payment_method: 'FPX',
        courier: null,
        status: 'payment_confirmed',
        days_since_order: 0,
      },
      created_at: '2024-11-22T11:20:00Z',
      updated_at: '2024-11-22T11:25:00Z',
    },
    {
      id: 'ord-005',
      customer: {
        name: 'Chen Li Wei',
        phone: '+60142223333',
        email: 'liwei.chen@gmail.com',
      },
      order: {
        order_id: 'NXR-20241118-008',
        total_amount: 1250.00,
        cart_items: 5,
        shipping_address: '67, Jalan Raja Chulan, 50200 Kuala Lumpur',
        tracking_number: 'DHLMY98765432',
        payment_method: 'Credit Card',
        courier: 'DHL',
        status: 'delivered',
        days_since_order: 4,
      },
      created_at: '2024-11-18T09:00:00Z',
      updated_at: '2024-11-22T10:00:00Z',
    },
    {
      id: 'ord-006',
      customer: {
        name: 'Fatimah binti Abdullah',
        phone: '+60155556666',
        email: 'fatimah.a@business.com',
      },
      order: {
        order_id: 'NXR-20241120-012',
        total_amount: 445.80,
        cart_items: 6,
        shipping_address: '34, Bandar Sunway, 47500 Subang Jaya',
        tracking_number: 'NINJAVANMY11223344',
        payment_method: 'E-Wallet',
        courier: 'Ninja Van',
        status: 'shipped',
        days_since_order: 2,
      },
      created_at: '2024-11-20T13:30:00Z',
      updated_at: '2024-11-21T16:00:00Z',
    },
    {
      id: 'ord-007',
      customer: {
        name: 'Yap Kah Lok',
        phone: '+60188889999',
        email: 'kahlok.yap@email.my',
      },
      order: {
        order_id: 'NXR-20241122-004',
        total_amount: 78.50,
        cart_items: 2,
        shipping_address: '56, Taman Tun Dr Ismail, 60000 Kuala Lumpur',
        tracking_number: null,
        payment_method: 'E-Wallet',
        courier: null,
        status: 'payment_pending',
        days_since_order: 0,
      },
      created_at: '2024-11-22T10:45:00Z',
      updated_at: '2024-11-22T10:45:00Z',
    },
    {
      id: 'ord-008',
      customer: {
        name: 'Siti Khadijah binti Harun',
        phone: '+60129998888',
        email: 'khadijah.h@gmail.com',
      },
      order: {
        order_id: 'NXR-20241115-022',
        total_amount: 189.00,
        cart_items: 3,
        shipping_address: '78, Jalan Genting Kelang, 53300 Kuala Lumpur',
        tracking_number: 'JNTMY87651234',
        payment_method: 'FPX',
        courier: 'J&T Express',
        status: 'return_requested',
        days_since_order: 7,
      },
      created_at: '2024-11-15T15:00:00Z',
      updated_at: '2024-11-22T09:30:00Z',
    },
  ],
  summary: {
    total_orders_today: 45,
    total_revenue_today: 12560.50,
    cart_abandonment_rate: 42.5,
    avg_fulfillment_time: 2.3,
    return_rate: 4.8,
    pending_shipments: 12,
  },
  abandoned_carts: [
    { id: 'cart-001', customer_name: 'Anonymous User', cart_value: 345.00, abandoned_at: '2024-11-22T08:30:00Z' },
    { id: 'cart-002', customer_name: 'Mohd Azlan', cart_value: 189.90, abandoned_at: '2024-11-22T07:15:00Z' },
    { id: 'cart-003', customer_name: 'Lee Mei Yin', cart_value: 567.50, abandoned_at: '2024-11-21T22:45:00Z' },
  ],
  pending_shipments: [
    { id: 'ord-002', customer_name: 'Kevin Ng Wei Jie', order_id: 'NXR-20241122-002', days_pending: 1 },
    { id: 'ord-004', customer_name: 'Hassan bin Othman', order_id: 'NXR-20241122-003', days_pending: 0 },
    { id: 'ord-010', customer_name: 'Razak bin Ismail', order_id: 'NXR-20241121-018', days_pending: 1 },
  ],
};
