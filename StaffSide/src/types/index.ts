// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    name: string;
    location: string;
  };
}

export interface Product {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  category: string;
  type: 'ingredient_based' | 'stock_based';
  is_available: boolean;
  quantity?: number;
}

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  total_amount: number;
  payment: number;
  change: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  created_at: string;
}