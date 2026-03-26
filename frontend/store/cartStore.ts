import { create } from 'zustand';
import { storage } from '../utils/storage';

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
    try {
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
      
      await storage.setItem('cart', JSON.stringify(newItems));
      set({ items: newItems });
    } catch (error) {
      console.error('addItem error:', error);
    }
  },
  
  removeItem: async (productId, variant) => {
    try {
      const items = get().items;
      const newItems = items.filter(
        i => !(i.productId === productId && 
        JSON.stringify(i.variant) === JSON.stringify(variant))
      );
      
      await storage.setItem('cart', JSON.stringify(newItems));
      set({ items: newItems });
    } catch (error) {
      console.error('removeItem error:', error);
    }
  },
  
  updateQuantity: async (productId, quantity, variant) => {
    try {
      const items = get().items;
      const newItems = items.map(i => {
        if (i.productId === productId && 
            JSON.stringify(i.variant) === JSON.stringify(variant)) {
          return { ...i, quantity };
        }
        return i;
      });
      
      await storage.setItem('cart', JSON.stringify(newItems));
      set({ items: newItems });
    } catch (error) {
      console.error('updateQuantity error:', error);
    }
  },
  
  clearCart: async () => {
    try {
      await storage.removeItem('cart');
      set({ items: [] });
    } catch (error) {
      console.error('clearCart error:', error);
    }
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
      const cartStr = await storage.getItem('cart');
      if (cartStr) {
        try {
          const items = JSON.parse(cartStr);
          set({ items });
        } catch (e) {
          console.error('Failed to parse cart data:', e);
          await storage.removeItem('cart');
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Set empty cart if storage fails
      set({ items: [] });
    }
  },
}));
