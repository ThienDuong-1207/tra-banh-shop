"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// State UI (mở/đóng) của cart drawer — tách khỏi CartContext vì đây là
// trạng thái hiển thị, không phải dữ liệu giỏ hàng. Giỏ hàng thật vẫn chỉ
// có một nguồn duy nhất: useCart() từ CartContext.
type CartDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [isOpen]
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) throw new Error("useCartDrawer phải được gọi bên trong CartDrawerProvider");
  return ctx;
}
