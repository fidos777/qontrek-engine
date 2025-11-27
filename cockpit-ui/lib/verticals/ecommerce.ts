/**
 * Qontrek OS Layer 4 - E-Commerce Vertical (Nexora)
 * Zod Schemas + Mock Data Factory
 */

import { z } from 'zod';
import {
  ValidationMessages,
  MalaysianPhoneSchema,
  CurrencySchema,
  PercentageSchema,
  VerticalMetadata,
  generateMalaysianPhone,
  generateMalaysianName,
  randomItem,
  randomInRange,
  randomDecimal,
  randomPastDate,
  generateId,
} from './types';

// =============================================================================
// Metadata
// =============================================================================

export const EcommerceMetadata: VerticalMetadata = {
  vertical_id: 'ecommerce',
  display_name: 'E-Commerce',
  display_name_bm: 'E-Dagang',
  icon: 'shopping-cart',
  color: '#8B5CF6', // Purple
  description: 'Online retail and customer journey management',
  description_bm: 'Pengurusan runcit dalam talian dan perjalanan pelanggan',
};

// =============================================================================
// Enums
// =============================================================================

export const CustomerSegments = [
  'new',
  'returning',
  'vip',
  'at_risk',
  'dormant',
] as const;

export const CustomerSegmentLabels: Record<typeof CustomerSegments[number], { en: string; bm: string }> = {
  'new': { en: 'New Customer', bm: 'Pelanggan Baru' },
  'returning': { en: 'Returning Customer', bm: 'Pelanggan Kembali' },
  'vip': { en: 'VIP Customer', bm: 'Pelanggan VIP' },
  'at_risk': { en: 'At Risk', bm: 'Berisiko Churn' },
  'dormant': { en: 'Dormant', bm: 'Tidak Aktif' },
};

export const EcommercePipelineStages = [
  'Browse',
  'Cart',
  'Checkout',
  'Delivered',
] as const;

export const EcommercePipelineStageLabels: Record<typeof EcommercePipelineStages[number], { en: string; bm: string }> = {
  'Browse': { en: 'Browsing', bm: 'Melayari' },
  'Cart': { en: 'Added to Cart', bm: 'Ditambah ke Troli' },
  'Checkout': { en: 'Checkout Initiated', bm: 'Checkout Dimulakan' },
  'Delivered': { en: 'Order Delivered', bm: 'Pesanan Dihantar' },
};

export const ProductCategories = [
  'electronics',
  'fashion',
  'beauty',
  'home_living',
  'groceries',
  'sports',
] as const;

export const ProductCategoryLabels: Record<typeof ProductCategories[number], { en: string; bm: string }> = {
  'electronics': { en: 'Electronics', bm: 'Elektronik' },
  'fashion': { en: 'Fashion', bm: 'Fesyen' },
  'beauty': { en: 'Beauty & Personal Care', bm: 'Kecantikan & Penjagaan Diri' },
  'home_living': { en: 'Home & Living', bm: 'Rumah & Gaya Hidup' },
  'groceries': { en: 'Groceries', bm: 'Barangan Runcit' },
  'sports': { en: 'Sports & Outdoors', bm: 'Sukan & Aktiviti Luar' },
};

// =============================================================================
// Lead Schema (Customer Profile)
// =============================================================================

export const EcommerceLeadSchema = z.object({
  id: z.string().optional(),
  customer_id: z.string()
    .min(5, { message: 'Customer ID must be at least 5 characters / ID pelanggan mesti sekurang-kurangnya 5 aksara' }),
  name: z.string().optional(),
  email: z.string().email({ message: ValidationMessages.invalidEmail.en }),
  phone: MalaysianPhoneSchema.optional(),
  cart_value: CurrencySchema.describe('Current cart value in MYR'),
  last_purchase: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: ValidationMessages.invalidDate.en,
  }).optional(),
  segment: z.enum(CustomerSegments, {
    errorMap: () => ({ message: 'Invalid customer segment / Segmen pelanggan tidak sah' }),
  }),
  lifetime_value: CurrencySchema.optional().describe('Customer lifetime value'),
  total_orders: z.number().int().nonnegative().default(0),
  avg_order_value: CurrencySchema.optional(),
  preferred_category: z.enum(ProductCategories).optional(),
  loyalty_points: z.number().int().nonnegative().default(0),
  created_at: z.string().datetime().optional(),
  last_active: z.string().datetime().optional(),
  source: z.enum(['organic', 'paid_search', 'social', 'email', 'referral', 'affiliate']).optional(),
});

export type EcommerceLead = z.infer<typeof EcommerceLeadSchema>;

// =============================================================================
// Pipeline Schema (Order Journey)
// =============================================================================

export const EcommercePipelineSchema = z.object({
  id: z.string(),
  customer_id: z.string(),
  customer_name: z.string().optional(),
  stage: z.enum(EcommercePipelineStages),
  cart_items: z.number().int().positive(),
  cart_value: CurrencySchema,
  discount_applied: CurrencySchema.optional(),
  shipping_fee: CurrencySchema.optional(),
  final_amount: CurrencySchema,
  payment_method: z.enum(['fpx', 'credit_card', 'ewallet', 'cod', 'bnpl']).optional(),
  shipping_address: z.string().optional(),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expected_delivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tracking_number: z.string().optional(),
  abandoned_reason: z.enum(['price', 'shipping', 'payment_failed', 'changed_mind', 'technical', 'unknown']).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type EcommercePipeline = z.infer<typeof EcommercePipelineSchema>;

// =============================================================================
// KPI Schema
// =============================================================================

export const EcommerceKPISchema = z.object({
  conversion_rate: PercentageSchema.describe('Visitor to purchase conversion'),
  cart_abandonment_rate: PercentageSchema.describe('Cart abandonment rate'),
  avg_order_value: CurrencySchema.describe('Average order value'),
  repeat_rate: PercentageSchema.describe('Repeat customer rate'),
  orders_today: z.number().int().nonnegative(),
  orders_mtd: z.number().int().nonnegative(),
  revenue_today: CurrencySchema,
  revenue_mtd: CurrencySchema,
  active_carts: z.number().int().nonnegative(),
  pending_deliveries: z.number().int().nonnegative(),
  returns_rate: PercentageSchema,
  nps_score: z.number().min(-100).max(100).describe('Net Promoter Score'),
  top_category: z.enum(ProductCategories),
});

export type EcommerceKPI = z.infer<typeof EcommerceKPISchema>;

// =============================================================================
// Mock Data Factory
// =============================================================================

const ProductNames = {
  electronics: ['iPhone 15 Pro', 'Samsung Galaxy S24', 'MacBook Air M3', 'Sony WH-1000XM5', 'iPad Pro'],
  fashion: ['Nike Air Max', 'Adidas Ultraboost', 'Uniqlo Airism Tee', 'Zara Blazer', 'Cotton On Jeans'],
  beauty: ['SK-II Essence', 'Maybelline Fit Me', 'Dove Shampoo', 'Innisfree Serum', 'MAC Lipstick'],
  home_living: ['IKEA MALM Bed', 'Dyson V15', 'Philips Air Fryer', 'Nespresso Machine', 'Robot Vacuum'],
  groceries: ['Dutch Lady Milk', 'Maggi Mee', 'Fresh Chicken', 'Imported Fruits', 'Organic Vegetables'],
  sports: ['Yoga Mat', 'Dumbbell Set', 'Running Shoes', 'Fitbit Watch', 'Protein Powder'],
};

export function generateEcommerceLead(): EcommerceLead {
  const segment = randomItem([...CustomerSegments]);
  const totalOrders = segment === 'new' ? 0 : randomInRange(1, 50);
  const avgOrderValue = randomDecimal(50, 500);
  const lastPurchaseDays = segment === 'dormant' ? randomInRange(90, 365) : randomInRange(1, 89);

  return {
    id: generateId('EC_LEAD'),
    customer_id: `CUST${randomInRange(10000, 99999)}`,
    name: generateMalaysianName(),
    email: `customer${randomInRange(100, 999)}@email.com`,
    phone: Math.random() > 0.3 ? generateMalaysianPhone() : undefined,
    cart_value: randomDecimal(0, 2000),
    last_purchase: totalOrders > 0 ? randomPastDate(lastPurchaseDays) : undefined,
    segment,
    lifetime_value: totalOrders > 0 ? Number((totalOrders * avgOrderValue).toFixed(2)) : undefined,
    total_orders: totalOrders,
    avg_order_value: totalOrders > 0 ? avgOrderValue : undefined,
    preferred_category: randomItem([...ProductCategories]),
    loyalty_points: randomInRange(0, 5000),
    created_at: new Date(Date.now() - randomInRange(30, 365) * 24 * 60 * 60 * 1000).toISOString(),
    last_active: new Date(Date.now() - randomInRange(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
    source: randomItem(['organic', 'paid_search', 'social', 'email', 'referral', 'affiliate']),
  };
}

export function generateEcommercePipeline(): EcommercePipeline {
  const stage = randomItem([...EcommercePipelineStages]);
  const cartItems = randomInRange(1, 8);
  const cartValue = randomDecimal(50, 2000);
  const discountApplied = Math.random() > 0.6 ? randomDecimal(10, cartValue * 0.3) : 0;
  const shippingFee = cartValue > 150 ? 0 : randomDecimal(5, 15);

  return {
    id: generateId('EC_ORDER'),
    customer_id: `CUST${randomInRange(10000, 99999)}`,
    customer_name: generateMalaysianName(),
    stage,
    cart_items: cartItems,
    cart_value: cartValue,
    discount_applied: discountApplied || undefined,
    shipping_fee: shippingFee || undefined,
    final_amount: Number((cartValue - discountApplied + shippingFee).toFixed(2)),
    payment_method: stage !== 'Browse' ? randomItem(['fpx', 'credit_card', 'ewallet', 'cod', 'bnpl']) : undefined,
    shipping_address: stage === 'Checkout' || stage === 'Delivered'
      ? `No. ${randomInRange(1, 200)}, Jalan ${randomItem(['Merdeka', 'Bunga', 'Seri'])} ${randomInRange(1, 20)}, ${randomItem(['Petaling Jaya', 'Shah Alam', 'Subang Jaya'])}`
      : undefined,
    order_date: stage === 'Delivered' || stage === 'Checkout' ? randomPastDate(14) : undefined,
    expected_delivery: stage === 'Delivered' ? randomPastDate(7) : stage === 'Checkout' ? randomPastDate(-7) : undefined,
    tracking_number: stage === 'Delivered' ? `MY${randomInRange(100000000, 999999999)}` : undefined,
    abandoned_reason: stage === 'Cart' || stage === 'Browse'
      ? randomItem(['price', 'shipping', 'payment_failed', 'changed_mind', 'technical', 'unknown', undefined])
      : undefined,
    created_at: new Date(Date.now() - randomInRange(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function generateEcommerceKPIs(): EcommerceKPI {
  return {
    conversion_rate: randomDecimal(2, 8),
    cart_abandonment_rate: randomDecimal(55, 75),
    avg_order_value: randomDecimal(120, 350),
    repeat_rate: randomDecimal(25, 45),
    orders_today: randomInRange(50, 300),
    orders_mtd: randomInRange(1500, 8000),
    revenue_today: randomDecimal(10000, 80000),
    revenue_mtd: randomDecimal(300000, 1500000),
    active_carts: randomInRange(200, 1000),
    pending_deliveries: randomInRange(100, 500),
    returns_rate: randomDecimal(3, 12),
    nps_score: randomInRange(30, 70),
    top_category: randomItem([...ProductCategories]),
  };
}

// Batch generators
export function generateMockEcommerceLeads(count = 10): EcommerceLead[] {
  return Array.from({ length: count }, generateEcommerceLead);
}

export function generateMockEcommercePipeline(count = 10): EcommercePipeline[] {
  return Array.from({ length: count }, generateEcommercePipeline);
}

// =============================================================================
// Export Vertical Package
// =============================================================================

export const EcommerceVertical = {
  metadata: EcommerceMetadata,
  schemas: {
    Lead: EcommerceLeadSchema,
    Pipeline: EcommercePipelineSchema,
    KPI: EcommerceKPISchema,
  },
  enums: {
    CustomerSegments,
    CustomerSegmentLabels,
    ProductCategories,
    ProductCategoryLabels,
    PipelineStages: EcommercePipelineStages,
    PipelineStageLabels: EcommercePipelineStageLabels,
  },
  mockFactory: {
    generateLead: generateEcommerceLead,
    generatePipeline: generateEcommercePipeline,
    generateKPIs: generateEcommerceKPIs,
    generateLeads: generateMockEcommerceLeads,
    generatePipelineRecords: generateMockEcommercePipeline,
  },
};

export default EcommerceVertical;
