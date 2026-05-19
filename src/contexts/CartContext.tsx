import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLineItem, ExhibitorCatalogueProduct } from '../types';

const STORAGE_KEY = 'boothbuzz_cart_v1';

interface CartContextValue {
  items: CartLineItem[];
  exhibitorId: string | null;
  exhibitorName: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (exhibitor: { id: string; companyName: string }, product: ExhibitorCatalogueProduct, qty?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

type StoredCart = { exhibitorId: string | null; exhibitorName: string | null; items: CartLineItem[] };

function loadStored(): StoredCart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { exhibitorId: null, exhibitorName: null, items: [] };
    const parsed = JSON.parse(raw) as StoredCart;
    return {
      exhibitorId: parsed.exhibitorId ?? null,
      exhibitorName: parsed.exhibitorName ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { exhibitorId: null, exhibitorName: null, items: [] };
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exhibitorId, setExhibitorId] = useState<string | null>(null);
  const [exhibitorName, setExhibitorName] = useState<string | null>(null);
  const [items, setItems] = useState<CartLineItem[]>([]);

  useEffect(() => {
    const stored = loadStored();
    setExhibitorId(stored.exhibitorId);
    setExhibitorName(stored.exhibitorName);
    setItems(stored.items);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ exhibitorId, exhibitorName, items }));
  }, [exhibitorId, exhibitorName, items]);

  const clearCart = useCallback(() => {
    setExhibitorId(null);
    setExhibitorName(null);
    setItems([]);
  }, []);

  const addItem = useCallback(
    (exhibitor: { id: string; companyName: string }, product: ExhibitorCatalogueProduct, qty = 1): boolean => {
      const line: CartLineItem = {
        productId: product.id,
        exhibitorId: exhibitor.id,
        exhibitorName: exhibitor.companyName,
        name: product.name,
        size: product.size,
        unit: product.unit,
        price: product.price,
        imageUrl: product.imageUrls[0] ?? null,
        quantity: qty,
      };

      if (exhibitorId && exhibitorId !== exhibitor.id && items.length > 0) {
        const ok = window.confirm(
          `Your cart has items from ${exhibitorName}. Clear cart and add from ${exhibitor.companyName}? You can only order from one exhibitor at a time.`
        );
        if (!ok) return false;
        setExhibitorId(exhibitor.id);
        setExhibitorName(exhibitor.companyName);
        setItems([line]);
        return true;
      }

      setExhibitorId(exhibitor.id);
      setExhibitorName(exhibitor.companyName);
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [...prev, line];
      });
      return true;
    },
    [exhibitorId, exhibitorName, items, clearCart]
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        if (next.length === 0) {
          setExhibitorId(null);
          setExhibitorName(null);
        }
        return next;
      });
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      if (next.length === 0) {
        setExhibitorId(null);
        setExhibitorName(null);
      }
      return next;
    });
  }, []);

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      exhibitorId,
      exhibitorName,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, exhibitorId, exhibitorName, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
