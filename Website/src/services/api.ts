// src/services/api.ts

import axios from 'axios';
import type { 
  AuthResponse, 
  Branch, 
  Product, 
  Report, 
  Staff 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.108.35.235:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email: string, password: string) => {
  return api.post<AuthResponse>('/login', { email, password });
};

export const logout = () => {
  return api.post('/logout');
};

export const getCurrentUser = () => {
  return api.get('/me');
};

// Super Admin APIs
export const getBranches = (params?: { type?: string; page?: number; per_page?: number }) => {
  return api.get('/super-admin/branches', { params });
};

export const createBranch = (data: { name: string; location: string; type: 'company' | 'franchise' }) => {
  return api.post('/super-admin/branches', data);
};

export const updateBranch = (id: number, data: Partial<Branch>) => {
  return api.put(`/super-admin/branches/${id}`, data);
};

export const deleteBranch = (id: number) => {
  return api.delete(`/super-admin/branches/${id}`);
};

export const createAdmin = (branchId: number, data: { name: string; email: string; password: string }) => {
  return api.post(`/super-admin/branches/${branchId}/create-admin`, data);
};

export const getBranchInventory = (branchId: number) => {
  return api.get(`/super-admin/branches/${branchId}/inventory`);
};

export const getAllInventorySummary = () => {
  return api.get('/super-admin/inventory/summary');
};

export const getOverallSales = (period: 'daily' | 'weekly' | 'monthly') => {
  return api.get('/super-admin/sales/overall', { params: { period } });
};

export const getBranchSales = (branchId: number, period: string) => {
  return api.get(`/super-admin/branches/${branchId}/sales`, { params: { period } });
};

export const getReports = (params?: { status?: string; type?: string; page?: number; per_page?: number }) => {
  return api.get('/super-admin/reports', { params });
};

export const approveReport = (reportId: number, response: string) => {
  return api.post(`/super-admin/reports/${reportId}/approve`, { response });
};

export const rejectReport = (reportId: number, response: string) => {
  return api.post(`/super-admin/reports/${reportId}/reject`, { response });
};

// Super Admin Category APIs
export const getAllCategories = () => {
  return api.get('/super-admin/categories/all');
};

export const toggleCategoryVisibility = (categoryId: number, branchId: number, isActive: boolean) => {
  return api.post(`/super-admin/categories/${categoryId}/toggle`, { branch_id: branchId, is_active: isActive });
};

// Admin APIs
export const getAdminDashboard = () => {
  return api.get('/admin/dashboard');
};

export const getProducts = () => {
  return api.get('/admin/products');
};

export const createProduct = (data: FormData | { name: string; price: number; category_id?: number; type: string }) => {
  // If data is FormData, send it directly
  if (data instanceof FormData) {
    return api.post('/admin/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  // Otherwise send as JSON
  return api.post('/admin/products', data);
};

export const updateProduct = (id: number, data: Partial<Product> | FormData) => {
  if (data instanceof FormData) {
    return api.post(`/admin/products/${id}?_method=PUT`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put(`/admin/products/${id}`, data);
};


export const deleteProduct = (id: number) => {
  return api.delete(`/admin/products/${id}`);
};

export const addProductRecipe = (productId: number, ingredients: Array<{ ingredient_id: number; quantity_needed: number }>) => {
  return api.post(`/admin/products/${productId}/recipe`, { ingredients });
};

export const setProductStock = (productId: number, quantity: number) => {
  return api.post(`/admin/products/${productId}/stock`, { quantity });
};

export const getIngredients = () => {
  return api.get('/admin/inventory/ingredients');
};

export const updateIngredientStock = (ingredientId: number, quantity: number, operation: 'add' | 'subtract' | 'set') => {
  return api.post('/admin/inventory/ingredients/update', { ingredient_id: ingredientId, quantity, operation });
};

export const addIngredient = (data: { name: string; unit: string }) => {
  return api.post('/admin/inventory/ingredients', data);
};

export const getProductStocks = () => {
  return api.get('/admin/inventory/stocks');
};

export const getStaff = () => {
  return api.get('/admin/staff');
};

export const createStaff = (data: { name: string; email: string; password: string }) => {
  return api.post('/admin/staff', data);
};

export const updateStaff = (id: number, data: Partial<Staff>) => {
  return api.put(`/admin/staff/${id}`, data);
};

export const deleteStaff = (id: number) => {
  return api.delete(`/admin/staff/${id}`);
};

export const getOrders = (params?: { date?: string; staff_id?: number; page?: number }) => {
  return api.get('/admin/orders', { params });
};

export const getOrderDetails = (orderId: number) => {
  return api.get(`/admin/orders/${orderId}`);
};

export const getTodayOrderSummary = () => {
  return api.get('/admin/orders/today-summary');
};

export const getAdminReports = (params?: { status?: string; type?: string; page?: number }) => {
  return api.get('/admin/reports', { params });
};

export const submitReport = (data: { type: string; title: string; description: string; priority?: string }) => {
  return api.post('/admin/reports', data);
};

export const updateReport = (reportId: number, data: Partial<Report>) => {
  return api.put(`/admin/reports/${reportId}`, data);
};

export const deleteReport = (reportId: number) => {
  return api.delete(`/admin/reports/${reportId}`);
};

export const exportSales = (startDate: string, endDate: string) => {
  return api.get('/admin/export/sales', {
    params: { start_date: startDate, end_date: endDate },
    responseType: 'blob',
  });
};

export const exportInventory = () => {
  return api.get('/admin/export/inventory', { responseType: 'blob' });
};

export const recordWaste = (ingredientId: number, quantity: number, reason: string) => {
  return api.post('/admin/inventory/waste', { ingredient_id: ingredientId, quantity, reason });
};

export const adjustStock = (ingredientId: number, quantity: number, reason: string) => {
  return api.post('/admin/inventory/adjust', { ingredient_id: ingredientId, quantity, reason });
};

export const getStockHistory = (ingredientId: number, startDate?: string, endDate?: string) => {
  return api.get(`/admin/inventory/ingredients/${ingredientId}/history`, {
    params: { start_date: startDate, end_date: endDate },
  });
};






// Add to existing imports
export const getCategories = () => {
  return api.get('/admin/category');
};

export const createCategory = (data: { name: string }) => {
  return api.post('/admin/category', data);
};

export const updateCategory = (id: number, data: { name: string }) => {
  return api.put(`/admin/category/${id}`, data);
};

export const deleteCategory = (id: number) => {
  return api.delete(`/admin/category/${id}`);
};

// For branch-specific categories (if you want to assign categories to specific branches)
export const getBranchCategories = (branchId: number) => {
  return api.get(`/admin/branch/${branchId}/categories`);
};

export const assignCategoryToBranch = (branchId: number, categoryId: number, isActive: boolean = true) => {
  return api.post(`/admin/branch/${branchId}/categories`, { category_id: categoryId, is_active: isActive });
};

export const removeCategoryFromBranch = (branchId: number, categoryId: number) => {
  return api.delete(`/admin/branch/${branchId}/categories/${categoryId}`);
};