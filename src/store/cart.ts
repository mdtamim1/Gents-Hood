import { create } from 'zustand';
import { CartItemType } from '@/types';

interface CartState {
  items: CartItemType[];
  directBuyItem: CartItemType | null;
  isOpen: boolean;
  addItem: (item: CartItemType) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  setDirectBuyItem: (item: CartItemType | null) => void;
  clearDirectBuyItem: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  directBuyItem: null,
  isOpen: false,
  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.productId === newItem.productId && item.variantId === newItem.variantId
      );

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += newItem.quantity;
        return { items: updatedItems, isOpen: true };
      }

      return { items: [...state.items, newItem], isOpen: true };
    });
  },
  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      ),
    }));
  },
  updateQuantity: (productId, quantity, variantId) => {
    set((state) => ({
      items: state.items
        .map((item) => {
          if (item.productId === productId && item.variantId === variantId) {
            return { ...item, quantity: Math.max(1, quantity) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    }));
  },
  clearCart: () => set({ items: [] }),
  setDirectBuyItem: (item) => {
    if (typeof window !== 'undefined') {
      try {
        if (item) {
          sessionStorage.setItem('gh_direct_buy_item_v1', JSON.stringify(item));
        } else {
          sessionStorage.removeItem('gh_direct_buy_item_v1');
        }
      } catch {}
    }
    set({ directBuyItem: item });
  },
  clearDirectBuyItem: () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('gh_direct_buy_item_v1');
      } catch {}
    }
    set({ directBuyItem: null });
  },
  setIsOpen: (isOpen) => set({ isOpen }),
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));
