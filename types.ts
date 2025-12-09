export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'delivery' | 'finished' | 'cancelled';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash';

export type MovementType = 'income' | 'expense';

export type OrderOrigin = 'whatsapp' | 'menu' | 'manual' | 'table';

export interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  delivery_fee: number;
  evolution_instance_id?: string;
  evolution_instance_token?: string;
  is_bot_active?: boolean;
  opening_hours?: OpeningHours;
  created_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_active: boolean;
  is_visible: boolean;
  created_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: number;
  restaurant_id: string;
  customer_id?: string;
  customer_name?: string; 
  customer_phone?: string;
  delivery_address?: string;
  status: OrderStatus;
  total: number;
  payment_method: PaymentMethod;
  items: OrderItem[]; // JSONB in DB
  origin: OrderOrigin;
  created_at: string;
}

export interface Customer {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  address?: string;
  created_at?: string;
}

export interface FinancialMovement {
  id: string;
  restaurant_id: string;
  type: MovementType;
  amount: number;
  category: string;
  payment_method: PaymentMethod;
  date: string; // timestamp
  description?: string;
}