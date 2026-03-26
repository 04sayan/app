import { create } from 'zustand';
import { storage } from '../utils/storage';

interface Customer {
  _id: string;
  phone: string;
  name?: string;
}

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  pincodeChecked: boolean;
  servicePincode: string | null;
  setCustomer: (customer: Customer | null) => void;
  setPincodeChecked: (checked: boolean, pincode?: string) => void;
  logout: () => void;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isAuthenticated: false,
  pincodeChecked: false,
  servicePincode: null,
  
  setCustomer: async (customer) => {
    try {
      if (customer) {
        await storage.setItem('customer', JSON.stringify(customer));
        set({ customer, isAuthenticated: true });
      } else {
        await storage.removeItem('customer');
        set({ customer: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('setCustomer error:', error);
    }
  },
  
  setPincodeChecked: async (checked, pincode) => {
    try {
      if (checked && pincode) {
        await storage.setItem('pincode', pincode);
        set({ pincodeChecked: true, servicePincode: pincode });
      } else {
        await storage.removeItem('pincode');
        set({ pincodeChecked: false, servicePincode: null });
      }
    } catch (error) {
      console.error('setPincodeChecked error:', error);
    }
  },
  
  logout: async () => {
    try {
      await storage.removeItem('customer');
      await storage.removeItem('pincode');
      await storage.removeItem('cart');
      set({ customer: null, isAuthenticated: false, pincodeChecked: false, servicePincode: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  loadAuth: async () => {
    try {
      const customerStr = await storage.getItem('customer');
      const pincode = await storage.getItem('pincode');
      
      if (customerStr) {
        try {
          const customer = JSON.parse(customerStr);
          set({ customer, isAuthenticated: true });
        } catch (e) {
          console.error('Failed to parse customer data:', e);
          await storage.removeItem('customer');
        }
      }
      
      if (pincode) {
        set({ pincodeChecked: true, servicePincode: pincode });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      // Set default state if storage fails
      set({ customer: null, isAuthenticated: false, pincodeChecked: false, servicePincode: null });
    }
  },
}));
