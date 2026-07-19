import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cart";
const DRAWER_AUTO_OPEN_DELAY_MS = 1500;

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStoredItems());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const autoOpenTimer = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    return () => {
      if (autoOpenTimer.current) clearTimeout(autoOpenTimer.current);
    };
  }, []);

  const clampQuantity = (quantity, stock) => {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (Number.isFinite(stock) && stock > 0) {
      return Math.min(qty, stock);
    }
    return qty;
  };

  const addItem = (product, quantity = 1) => {
    setItems((current) => {
      const stock = Number.isFinite(Number(product.stock_quantity)) ? Number(product.stock_quantity) : undefined;
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        const nextQuantity = clampQuantity(existing.quantity + quantity, stock);
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: nextQuantity, stock } : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price_cents: product.price_cents,
          image_url: product.image_url,
          stock,
          quantity: clampQuantity(quantity, stock),
        },
      ];
    });

    if (autoOpenTimer.current) clearTimeout(autoOpenTimer.current);
    autoOpenTimer.current = setTimeout(() => {
      setIsDrawerOpen(true);
    }, DRAWER_AUTO_OPEN_DELAY_MS);
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.id === productId
          ? { ...item, quantity: clampQuantity(quantity, item.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalCents = items.reduce(
    (sum, item) => sum + Number(item.price_cents || 0) * Number(item.quantity || 0),
    0
  );

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalCount,
    totalCents,
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
