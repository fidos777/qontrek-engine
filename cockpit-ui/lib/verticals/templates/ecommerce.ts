// lib/verticals/templates/ecommerce.ts
// Nexora - E-commerce operations vertical

import type { VerticalTemplate } from '../types';

export const ecommerceTemplate: VerticalTemplate = {
  id: 'ecommerce',
  name: 'E-Commerce Operations',
  name_ms: 'Operasi E-Dagang',
  description: 'E-commerce order management, fulfillment, and customer recovery for online retailers',
  icon: 'ShoppingCart',
  color: '#7C3AED', // Violet

  tenant_defaults: {
    currency: 'MYR',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    date_format: 'DD/MM/YYYY',
  },

  field_mappings: [
    { generic_field: 'lead.name', vertical_label: 'Customer Name', vertical_field: 'customer.name' },
    { generic_field: 'lead.amount', vertical_label: 'Order Value', vertical_field: 'order.total_amount', format: 'RM {{value}}' },
    { generic_field: 'lead.phone', vertical_label: 'Contact Number', vertical_field: 'customer.phone' },
    { generic_field: 'lead.email', vertical_label: 'Email', vertical_field: 'customer.email' },
    { generic_field: 'lead.stage', vertical_label: 'Order Status', vertical_field: 'order.status' },
    { generic_field: 'lead.custom_1', vertical_label: 'Order ID', vertical_field: 'order.order_id' },
    { generic_field: 'lead.custom_2', vertical_label: 'Cart Items', vertical_field: 'order.cart_items' },
    { generic_field: 'lead.custom_3', vertical_label: 'Shipping Address', vertical_field: 'order.shipping_address' },
    { generic_field: 'lead.custom_4', vertical_label: 'Tracking Number', vertical_field: 'order.tracking_number' },
    { generic_field: 'lead.custom_5', vertical_label: 'Payment Method', vertical_field: 'order.payment_method' },
    { generic_field: 'lead.custom_6', vertical_label: 'Courier', vertical_field: 'order.courier' },
    { generic_field: 'lead.days_overdue', vertical_label: 'Days Since Order', vertical_field: 'order.days_since_order' },
  ],

  stages: [
    {
      id: 'cart',
      name: 'Cart',
      name_ms: 'Troli',
      color: '#6B7280',
      order: 1,
      auto_actions: [
        { trigger: 'days_in_stage > 1', action: 'send_reminder', template_id: 'cart_abandonment' }
      ]
    },
    { id: 'checkout', name: 'Checkout', name_ms: 'Pembayaran', color: '#F59E0B', order: 2, sla_days: 1 },
    { id: 'payment_pending', name: 'Payment Pending', name_ms: 'Menunggu Bayaran', color: '#EF4444', order: 3, sla_days: 1 },
    { id: 'payment_confirmed', name: 'Payment Confirmed', name_ms: 'Bayaran Disahkan', color: '#3B82F6', order: 4 },
    { id: 'processing', name: 'Processing', name_ms: 'Diproses', color: '#8B5CF6', order: 5, sla_days: 1 },
    { id: 'shipped', name: 'Shipped', name_ms: 'Dihantar', color: '#06B6D4', order: 6 },
    { id: 'out_for_delivery', name: 'Out for Delivery', name_ms: 'Dalam Penghantaran', color: '#10B981', order: 7 },
    { id: 'delivered', name: 'Delivered', name_ms: 'Telah Sampai', color: '#22C55E', order: 8 },
    { id: 'completed', name: 'Completed', name_ms: 'Selesai', color: '#059669', order: 9 },
    { id: 'return_requested', name: 'Return Requested', name_ms: 'Minta Pemulangan', color: '#F59E0B', order: 10 },
    { id: 'refunded', name: 'Refunded', name_ms: 'Dikembalikan', color: '#6B7280', order: 11 },
  ],

  kpis: [
    {
      id: 'cart_abandonment_rate',
      name: 'Cart Abandonment Rate',
      name_ms: 'Kadar Tinggal Troli',
      description: 'Percentage of shopping carts abandoned before checkout',
      formula: 'abandoned / total_carts * 100',
      unit: 'percentage',
      target: 30,
      warning_threshold: 50,
      critical_threshold: 70,
      higher_is_better: false,
    },
    {
      id: 'fulfillment_time',
      name: 'Avg Fulfillment Time',
      name_ms: 'Purata Masa Penghantaran',
      description: 'Average time from order to delivery',
      formula: 'avg(fulfillment_days)',
      unit: 'days',
      target: 3,
      warning_threshold: 5,
      critical_threshold: 7,
      higher_is_better: false,
    },
    {
      id: 'return_rate',
      name: 'Return Rate',
      name_ms: 'Kadar Pemulangan',
      description: 'Percentage of orders returned',
      formula: 'returns / completed * 100',
      unit: 'percentage',
      target: 5,
      warning_threshold: 10,
      critical_threshold: 15,
      higher_is_better: false,
    },
    {
      id: 'daily_orders',
      name: 'Daily Orders',
      name_ms: 'Pesanan Harian',
      description: 'Number of orders received today',
      formula: 'count(orders_today)',
      unit: 'count',
      target: 100,
      warning_threshold: 50,
      critical_threshold: 20,
      higher_is_better: true,
    },
    {
      id: 'total_revenue',
      name: 'Total Revenue',
      name_ms: 'Jumlah Hasil',
      description: 'Total revenue from completed orders',
      formula: 'sum(order_value)',
      unit: 'currency',
      target: 50000,
      warning_threshold: 30000,
      critical_threshold: 10000,
      higher_is_better: true,
    },
  ],

  dashboards: [
    {
      id: 'orders',
      name: 'Order Management',
      description: 'Track and manage customer orders',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'daily_orders' } },
        { widget_type: 'kpi_card', position: { col: 1, row: 0, width: 1, height: 1 }, config: { kpi_id: 'total_revenue' } },
        { widget_type: 'kpi_card', position: { col: 2, row: 0, width: 1, height: 1 }, config: { kpi_id: 'fulfillment_time' } },
        { widget_type: 'trust_meter', position: { col: 3, row: 0, width: 1, height: 1 } },
        { widget_type: 'pipeline_funnel', position: { col: 0, row: 1, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 2, row: 1, width: 2, height: 2 }, config: { filter: 'processing' } },
      ],
    },
    {
      id: 'recovery',
      name: 'Cart Recovery',
      description: 'Recover abandoned carts and lost sales',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'cart_abandonment_rate' } },
        { widget_type: 'recovery_chart', position: { col: 1, row: 0, width: 2, height: 2 } },
        { widget_type: 'lead_table', position: { col: 0, row: 1, width: 1, height: 2 }, config: { filter: 'abandoned' } },
        { widget_type: 'reminder_list', position: { col: 3, row: 0, width: 1, height: 2 } },
      ],
    },
    {
      id: 'returns',
      name: 'Returns & Refunds',
      description: 'Manage product returns and refunds',
      widgets: [
        { widget_type: 'kpi_card', position: { col: 0, row: 0, width: 1, height: 1 }, config: { kpi_id: 'return_rate' } },
        { widget_type: 'lead_table', position: { col: 0, row: 1, width: 4, height: 2 }, config: { filter: 'returns' } },
      ],
    },
  ],

  whatsapp_templates: [
    {
      id: 'cart_abandonment',
      name: 'abandoned_cart_reminder',
      purpose: 'Remind customer about abandoned cart',
      language: 'ms',
      category: 'marketing',
      body_template: 'Hi {{customer_name}}, anda ada barang dalam troli bernilai RM{{cart_value}}! Lengkapkan pembelian anda sekarang dan nikmati penghantaran percuma. Klik sini: {{checkout_link}} - Nexora',
      variables: ['customer_name', 'cart_value', 'checkout_link'],
      use_cases: ['cart stage', 'days_in_stage > 1'],
    },
    {
      id: 'order_confirmation',
      name: 'order_confirmed',
      purpose: 'Confirm order placement',
      language: 'ms',
      category: 'utility',
      body_template: 'Terima kasih {{customer_name}}! Pesanan anda #{{order_id}} bernilai RM{{amount}} telah diterima. Kami akan memaklumkan apabila pesanan dihantar. - Nexora',
      variables: ['customer_name', 'order_id', 'amount'],
      use_cases: ['payment_confirmed stage'],
    },
    {
      id: 'shipping_update',
      name: 'shipping_notification',
      purpose: 'Notify customer of shipment',
      language: 'en',
      category: 'utility',
      body_template: 'Good news {{customer_name}}! Your order #{{order_id}} has been shipped via {{courier}}. Track your delivery: {{tracking_link}} - Nexora',
      variables: ['customer_name', 'order_id', 'courier', 'tracking_link'],
      use_cases: ['shipped stage'],
    },
    {
      id: 'delivery_notification',
      name: 'delivery_complete',
      purpose: 'Confirm delivery completion',
      language: 'ms',
      category: 'utility',
      body_template: 'Pesanan anda #{{order_id}} telah selamat sampai! Terima kasih kerana membeli-belah dengan kami. Nikmati produk anda! - Nexora',
      variables: ['order_id'],
      use_cases: ['delivered stage'],
    },
  ],

  governance: {
    required_gates: ['G13', 'G14', 'G15', 'G16', 'G18', 'G21'],
    audit_retention_days: 2555,
    pii_fields: ['customer.name', 'customer.phone', 'customer.email', 'order.shipping_address'],
  },

  features: {
    whatsapp_enabled: true,
    ai_suggestions_enabled: true,
    auto_reminders_enabled: true,
    multi_currency: false,
  },
};
