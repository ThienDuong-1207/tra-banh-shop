import { supabase } from "./supabaseClient";

export type ShopSettings = {
  gpkd_number: string;
  addresses: string[];
};

const EMPTY: ShopSettings = { gpkd_number: "", addresses: [] };

// Đọc từ bảng shop_settings (chỉ tồn tại sau khi chạy
// supabase/migrations/003_shop_settings.sql) — nếu chưa chạy migration hoặc
// lỗi mạng, trả về rỗng thay vì crash Footer (đúng pattern getAllProducts).
export async function getShopSettings(): Promise<ShopSettings> {
  const { data, error } = await supabase.from("shop_settings").select("gpkd_number, addresses").eq("id", true).maybeSingle();
  if (error || !data) {
    if (error) console.error("getShopSettings:", error.message);
    return EMPTY;
  }
  return { gpkd_number: data.gpkd_number ?? "", addresses: data.addresses ?? [] };
}
