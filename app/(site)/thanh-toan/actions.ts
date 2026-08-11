"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type CartItemInput = {
  product_id: string;
  don_vi: "le" | "thung";
  so_luong: number;
};

function generateOrderCode(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DH${y}${m}${d}-${suffix}`;
}

function redirectToCheckoutError(message: string): never {
  redirect(`/thanh-toan?loi=${encodeURIComponent(message)}`);
}

// Đặt hàng từ giỏ hàng (guest checkout) — nhận formData từ trang
// /thanh-toan. Giá luôn được TRA LẠI từ view public_products ngay tại đây,
// không tin số don_gia mà client gửi lên, để tránh bị chỉnh sửa giá qua
// devtools trước khi gửi đơn.
export async function createOrder(formData: FormData): Promise<void> {
  const customer_name = String(formData.get("customer_name") ?? "").trim();
  const customer_phone = String(formData.get("customer_phone") ?? "").trim();
  const customer_address = String(formData.get("customer_address") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");

  if (!customer_name || !customer_phone) {
    redirectToCheckoutError("Vui lòng nhập đầy đủ họ tên và số điện thoại.");
  }

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(itemsRaw);
  } catch {
    rawItems = [];
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    redirect("/gio-hang");
  }
  const items = rawItems as CartItemInput[];

  const productIds = [...new Set(items.map((i) => i.product_id))];
  const { data: products, error: productsError } = await supabase
    .from("public_products")
    .select("id, ten_hang_hoa, gia_ban, gia_thung")
    .in("id", productIds);

  if (productsError || !products) {
    redirectToCheckoutError("Không tải được thông tin sản phẩm, vui lòng thử lại.");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = items
    .map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) return null;
      const so_luong = Math.max(1, Math.floor(Number(item.so_luong) || 1));
      const don_vi = item.don_vi === "thung" && product.gia_thung != null ? "thung" : "le";
      const don_gia = don_vi === "thung" ? product.gia_thung! : product.gia_ban;
      if (don_gia == null) return null;
      return {
        product_id: product.id,
        ten_hang_hoa: product.ten_hang_hoa,
        don_vi,
        don_gia,
        so_luong,
        thanh_tien: don_gia * so_luong,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderItems.length === 0) {
    redirect("/gio-hang");
  }

  const total_amount = orderItems.reduce((sum, i) => sum + i.thanh_tien, 0);
  const orderId = crypto.randomUUID();

  let order_code = generateOrderCode(new Date());
  let lastError: { code?: string; message: string } | null = null;
  let inserted = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      order_code,
      customer_name,
      customer_phone,
      customer_address: customer_address || null,
      note: note || null,
      total_amount,
    });
    if (!error) {
      inserted = true;
      break;
    }
    lastError = error;
    if (error.code === "23505") {
      order_code = generateOrderCode(new Date());
      continue;
    }
    break;
  }

  if (!inserted) {
    console.error("createOrder insert orders:", lastError?.message);
    redirectToCheckoutError("Không tạo được đơn hàng, vui lòng thử lại.");
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: orderId })));

  if (itemsError) {
    console.error("createOrder insert order_items:", itemsError.message);
    redirectToCheckoutError("Không lưu được chi tiết đơn hàng, vui lòng thử lại.");
  }

  redirect(`/dat-hang-thanh-cong?ma=${encodeURIComponent(order_code)}&tong=${total_amount}`);
}
