import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    if (customer) {
      await AsyncStorage.setItem('customer', JSON.stringify(customer));
      set({ customer, isAuthenticated: true });
    } else {
      await AsyncStorage.removeItem('customer');
      set({ customer: null, isAuthenticated: false });
    }
  },
  
  setPincodeChecked: async (checked, pincode) => {
    if (checked && pincode) {
      await AsyncStorage.setItem('pincode', pincode);
      set({ pincodeChecked: true, servicePincode: pincode });
    } else {
      await AsyncStorage.removeItem('pincode');
      set({ pincodeChecked: false, servicePincode: null });
    }
  },
  
  logout: async () => {
    await AsyncStorage.multiRemove(['customer', 'pincode', 'cart']);
    set({ customer: null, isAuthenticated: false, pincodeChecked: false, servicePincode: null });
  },
  
  loadAuth: async () => {
    try {
      const [customerStr, pincode] = await AsyncStorage.multiGet(['customer', 'pincode']);
      
      if (customerStr[1]) {
        const customer = JSON.parse(customerStr[1]);
        set({ customer, isAuthenticated: true });
      }
      
      if (pincode[1]) {
        set({ pincodeChecked: true, servicePincode: pincode[1] });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    }
  },
}));
