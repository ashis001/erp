export type UserRole = 'superadmin' | 'book_admin' | 'counter_admin' | 'japa_admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Item {
  id: number;
  category_id: number;
  name: string;
  sku: string;
  default_selling_price: number;
}

export interface InventoryLot {
  id: number;
  item_id: number;
  qty_purchased: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
}

export interface Assignment {
  id: number;
  item_id: number;
  admin_user_id: number;
  qty_assigned: number;
  source_lot_id: number;
  created_at: string;
}

export interface Sale {
  id: number;
  item_id: number;
  admin_user_id: number;
  qty_sold: number;
  unit_price: number;
  total_price: number;
  customer_name: string;
  customer_address?: string | null;
  customer_phone?: string | null;
  created_at: string;
}

export interface CreditSale {
  id: number;
  item_id: number;
  admin_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  down_payment: number;
  payment_type: 'emi' | 'pay_later';
  emi_periods: number | null;
  monthly_emi: number;
  pay_later_date?: string | null;
  pending_balance: number;
  status: 'active' | 'completed' | 'defaulted';
  created_at: string;
  item_name?: string;
  admin_name?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'SELL' | 'ADJUST';
  entity_type: string;
  entity_id: number;
  timestamp: string;
}
