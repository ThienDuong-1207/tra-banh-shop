// Khớp đúng view public_products (chỉ các cột an toàn để hiển thị công khai)
// và 2 bảng orders/order_items mới — xem SQL ở
// supabase/migrations/001_orders_and_public_products.sql,
// supabase/migrations/002_add_description_to_public_products.sql
export type PublicProduct = {
  id: string;
  ten_hang_hoa: string;
  mo_ta: string | null;
  category_sheet: string;
  dvt: string | null;
  gia_ban: number | null;
  quy_cach: string | null;
  gia_thung: number | null;
  brand_name: string | null;
};

export type CartItem = {
  product_id: string;
  ten_hang_hoa: string;
  category_sheet: string | null;
  don_vi: "le" | "thung";
  don_gia: number;
  so_luong: number;
};

export type OrderStatus = "cho_thanh_toan" | "da_thanh_toan" | "dang_xu_ly" | "dang_giao" | "hoan_thanh" | "huy";
