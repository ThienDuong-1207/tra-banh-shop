import { createClient } from "@supabase/supabase-js";

// Web công khai — CHỈ dùng anon key (không bao giờ dùng service role ở đây).
// Đọc sản phẩm qua view public_products (đã lọc cột an toàn), ghi orders/
// order_items qua policy RLS cho phép insert công khai — xem
// documents/ke_hoach_trien_khai_website_ecommerce.md trong misa-price-manager.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
