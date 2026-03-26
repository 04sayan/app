import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  productId: string;
  productName: string;
  variant?: any;
  quantity: number;
  price: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: any) => void;
  updateQuantity: (productId: string, quantity: number, variant?: any) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  loadCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: async (item) => {
    const items = get().items;
    const existingIndex = items.findIndex(
      i => i.productId === item.productId && 
      JSON.stringify(i.variant) === JSON.stringify(item.variant)
    );
    
    let newItems;
    if (existingIndex >= 0) {
      newItems = [...items];
      newItems[existingIndex].quantity += item.quantity;
    } else {
      newItems = [...items, item];
    }
    
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  
  removeItem: async (productId, variant) => {
    const items = get().items;
    const newItems = items.filter(
      i => !(i.productId === productId && 
      JSON.stringify(i.variant) === JSON.stringify(variant))
    );
    
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  
  updateQuantity: async (productId, quantity, variant) => {
    const items = get().items;
    const newItems = items.map(i => {
      if (i.productId === productId && 
          JSON.stringify(i.variant) === JSON.stringify(variant)) {
        return { ...i, quantity };
      }
      return i;
    });
    
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    set({ items: newItems });
  },
  
  clearCart: async () => {
    await AsyncStorage.removeItem('cart');
    set({ items: [] });
  },
  
  getTotal: () => {
    const items = get().items;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  getItemCount: () => {
    const items = get().items;
    return items.reduce((count, item) => count + item.quantity, 0);
  },
  
  loadCart: async () => {
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      if (cartStr) {
        const items = JSON.parse(cartStr);
        set({ items });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  },
}));
