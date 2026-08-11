import { supabase } from "./supabaseClient";
import type { PublicProduct } from "./types";

// Đọc từ view public_products (chỉ tồn tại sau khi chạy
// supabase/migrations/001_orders_and_public_products.sql) — nếu view chưa
// có (chưa chạy migration), trả về mảng rỗng thay vì crash trang, để Phase 1
// vẫn build/deploy được trước khi migration chạy.
export async function getAllProducts(): Promise<PublicProduct[]> {
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .order("category_sheet", { ascending: true })
    .order("ten_hang_hoa", { ascending: true });
  if (error) {
    console.error("getAllProducts:", error.message);
    return [];
  }
  return (data ?? []) as PublicProduct[];
}

export async function getProductsByCategory(category: string): Promise<PublicProduct[]> {
  const { data, error } = await supabase
    .from("public_products")
    .select("*")
    .eq("category_sheet", category)
    .order("ten_hang_hoa", { ascending: true });
  if (error) {
    console.error("getProductsByCategory:", error.message);
    return [];
  }
  return (data ?? []) as PublicProduct[];
}

export async function getProductById(id: string): Promise<PublicProduct | null> {
  const { data, error } = await supabase.from("public_products").select("*").eq("id", id).single();
  if (error) {
    console.error("getProductById:", error.message);
    return null;
  }
  return data as PublicProduct;
}

export function formatVnd(v: number | null | undefined): string {
  if (v == null) return "Liên hệ";
  return v.toLocaleString("vi-VN") + "đ";
}
