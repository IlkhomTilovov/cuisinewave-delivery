import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  sessionId: string;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),
      
      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find(i => i.productId === item.productId);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                ...item,
                id: Math.random().toString(36).substring(2),
                quantity: 1,
              },
            ],
          });
        }
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter(i => i.productId !== productId),
        });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.discountPrice ?? item.price;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'milliy-taomlar-cart',
    }
  )
);
