// src/services/api.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Order } from '../types';

// Make sure this matches your backend URL - use your computer's IP if testing on physical device
// For emulator: http://10.0.2.2:8000
// For physical device: http://YOUR_COMPUTER_IP:8000
const API_URL = 'http://10.108.35.235:8000/api'; // Change this for emulator
const BASE_URL = 'http://10.108.35.235:8000'; // Change this for emulator

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email: string, password: string) => {
  return api.post('/login', { email, password });
};

export const logout = () => {
  return api.post('/logout');
};

export const getProducts = async () => {
  const response = await api.get('/staff/pos/products');
  
  console.log('Raw API response:', JSON.stringify(response.data, null, 2));
  
  // Helper function to get full image URL
  const getFullImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    // If it starts with /storage, prepend base URL
    if (imagePath.startsWith('/storage')) return `${BASE_URL}${imagePath}`;
    // If it's just a filename, assume it's in storage/products
    if (!imagePath.includes('/')) return `${BASE_URL}/storage/products/${imagePath}`;
    // Otherwise prepend base URL
    return `${BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  };
  
  let productsData: any[] = [];
  
  // The API returns {products: [...], grouped: {...}} from POSController
  if (response.data && response.data.products) {
    productsData = response.data.products;
  } 
  // Handle array response from ProductController
  else if (Array.isArray(response.data)) {
    productsData = response.data;
  }
  // Handle nested data
  else if (response.data && response.data.data) {
    productsData = response.data.data;
  }
  
  const productsWithFullImageUrl = productsData.map((product: any) => {
    const fullImageUrl = getFullImageUrl(product.image);
    console.log(`Product: ${product.name}, Image path: ${product.image}, Full URL: ${fullImageUrl}`);
    return {
      ...product,
      image: fullImageUrl,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
    };
  });
  
  return { data: productsWithFullImageUrl };
};

export const processOrder = (items: Array<{ product_id: number; quantity: number }>, payment: number) => {
  return api.post('/staff/pos/order', { items, payment });
};

export const calculateTotal = (items: Array<{ product_id: number; quantity: number }>) => {
  return api.post('/staff/pos/calculate', { items });
};

export const toggleProductVisibility = (productId: number, isAvailable: boolean) => {
  return api.patch(`/staff/pos/products/${productId}/toggle`, { is_available: isAvailable });
};