import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE = `${Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Auth APIs
export const authAPI = {
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  getCustomer: (phone: string) => api.get(`/auth/customer/${phone}`),
  updateCustomer: (phone: string, name: string) => api.put(`/auth/customer/${phone}`, name, {
    headers: { 'Content-Type': 'application/json' }
  }),
};

// Product APIs
export const productAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Address APIs
export const addressAPI = {
  getCustomerAddresses: (phone: string) => api.get(`/addresses/customer/${phone}`),
  create: (data: any) => api.post('/addresses', data),
  update: (id: string, data: any) => api.put(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
};

// Order APIs
export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getCustomerOrders: (phone: string) => api.get(`/orders/customer/${phone}`),
  getById: (orderId: string) => api.get(`/orders/${orderId}`),
  cancel: (orderId: string) => api.put(`/orders/${orderId}/cancel`),
  getAll: (params?: any) => api.get('/orders', { params }),
  updateStatus: (orderId: string, status: string) => 
    api.put(`/orders/${orderId}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    }),
};

// Pincode APIs
export const pincodeAPI = {
  check: (pincode: string) => api.get(`/pincodes/check/${pincode}`),
  request: (data: any) => api.post('/pincodes/request', data),
  getAll: () => api.get('/pincodes'),
  create: (data: any) => api.post('/pincodes', data),
  update: (id: string, isActive: boolean) => 
    api.put(`/pincodes/${id}`, isActive, {
      headers: { 'Content-Type': 'application/json' }
    }),
};

// Coupon APIs
export const couponAPI = {
  validate: (code: string, orderValue: number) => 
    api.post('/coupons/validate', { code, orderValue }),
  getAll: () => api.get('/coupons'),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
};

// Delivery Slot APIs
export const slotAPI = {
  getAll: () => api.get('/slots'),
  create: (data: any) => api.post('/slots', data),
  update: (id: string, data: any) => api.put(`/slots/${id}`, data),
};

// Admin APIs
export const adminAPI = {
  login: (username: string, password: string) => 
    api.post('/admin/login', { username, password }),
  getCustomers: () => api.get('/admin/customers'),
  getPincodeRequests: () => api.get('/admin/pincode-requests'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: any) => 
    api.put('/admin/settings', { key, value }),
  changePassword: (current_password: string, new_password: string) =>
    api.post('/admin/change-password', { current_password, new_password }),
};

export default api;
