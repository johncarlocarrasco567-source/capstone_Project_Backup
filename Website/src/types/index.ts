// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  branch: Branch | null;
}

export interface Branch {
  id: number;
  name: string;
  location: string;
  type: 'company' | 'franchise';
  users_count?: number;
  orders_count?: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  type: 'ingredient_based' | 'stock_based';
  is_available: boolean;
  recipe_count?: number;
  quantity?: number;
}

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  status: 'good' | 'medium' | 'low' | 'critical' | 'out_of_stock';
}

export interface Order {
  id: number;
  total_amount: number;
  payment: number;
  change: number;
  staff: string;
  items_count: number;
  created_at: string;
}

export interface Report {
  id: number;
  title: string;
  type: 'product_proposal' | 'damage' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  response?: string;
  branch?: Branch;
  created_at: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  orders_today: number;
  sales_today: number;
  created_at: string;
}

export interface SalesData {
  total_sales: number;
  order_count: number;
  average_order_value: number;
  sales_by_day?: any[];
  growth_percentage?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  role: string;
  redirect_to: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
}