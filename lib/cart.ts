import type { CartItem } from "./types";

const STORAGE_KEY = "tra-banh-cart";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function cartLineKey(item: Pick<CartItem, "product_id" | "don_vi">): string {
  return `${item.product_id}:${item.don_vi}`;
}
