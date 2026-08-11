"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/lib/types";
import { cartLineKey, loadCart, saveCart } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  updateQty: (productId: string, donVi: CartItem["don_vi"], soLuong: number) => void;
  removeItem: (productId: string, donVi: CartItem["don_vi"]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Giỏ hàng chỉ tồn tại trên trình duyệt khách (localStorage) — đọc lại
  // sau khi mount để tránh lệch nội dung giữa server render và client.
  // (Không thể dùng lazy initializer trong useState vì sẽ đọc localStorage
  // ngay ở lần render đầu trên client, gây hydration mismatch với HTML do
  // server render ra.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ 1 lần từ localStorage (hệ thống ngoài React) sau khi mount, không phải state suy ra từ props/state khác
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const key = cartLineKey(item);
      const existing = prev.find((p) => cartLineKey(p) === key);
      if (existing) {
        return prev.map((p) => (cartLineKey(p) === key ? { ...p, so_luong: p.so_luong + item.so_luong } : p));
      }
      return [...prev, item];
    });
  };

  const updateQty = (productId: string, donVi: CartItem["don_vi"], soLuong: number) => {
    setItems((prev) =>
      soLuong <= 0
        ? prev.filter((p) => !(p.product_id === productId && p.don_vi === donVi))
        : prev.map((p) => (p.product_id === productId && p.don_vi === donVi ? { ...p, so_luong: soLuong } : p))
    );
  };

  const removeItem = (productId: string, donVi: CartItem["don_vi"]) => {
    setItems((prev) => prev.filter((p) => !(p.product_id === productId && p.don_vi === donVi)));
  };

  const clear = () => setItems([]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.so_luong, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + i.don_gia * i.so_luong, 0), [items]);

  const value = useMemo(
    () => ({ items, itemCount, totalAmount, hydrated, addItem, updateQty, removeItem, clear }),
    [items, itemCount, totalAmount, hydrated]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải được gọi bên trong CartProvider");
  return ctx;
}
