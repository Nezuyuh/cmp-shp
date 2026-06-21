'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, Product, ProductVariant } from '@/types';

const CART_KEY = 'cmpshp_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  }, []);

  const addItem = useCallback(
    (product: Product, variant?: ProductVariant, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.findIndex(
          (i) => i.product.id === product.id && i.variant?.id === variant?.id
        );
        let next: CartItem[];
        if (existing >= 0) {
          next = prev.map((item, idx) =>
            idx === existing ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          next = [...prev, { product, variant, quantity }];
        }
        saveCart(next);
        return next;
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) => {
      setItems((prev) => {
        const next = prev.filter(
          (i) => !(i.product.id === productId && i.variant?.id === variantId)
        );
        saveCart(next);
        return next;
      });
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | undefined, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      setItems((prev) => {
        const next = prev.map((item) =>
          item.product.id === productId && item.variant?.id === variantId
            ? { ...item, quantity }
            : item
        );
        saveCart(next);
        return next;
      });
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + (i.variant?.price ?? i.product.price) * i.quantity,
    0
  );

  return {
    items,
    hydrated,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
}
