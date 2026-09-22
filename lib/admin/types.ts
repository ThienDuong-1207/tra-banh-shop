// Danh sách view của HomeClient.tsx — tách ra đây (thay vì khai báo cục bộ
// trong HomeClient.tsx) vì OverviewView cần kiểu này cho prop `onNavigate`.
export type View =
  | "tongquan"
  | "hanghoa"
  | "tonkho"
  | "baocao"
  | "duyetgia"
  | "users"
  | "activitylog"
  | "donhang"
  | "khachhang"
  | "caidat"
  | "anhsanpham"
  | "khuyenmai";

// Khớp đúng bảng coupons — xem supabase/migrations/005_coupons.sql. Cùng
// shape với lib/types.ts (Coupon) phía public, khai báo riêng ở đây vì
// lib/admin không được import lib/ public theo quy ước (docs/component-conventions.md).
export type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  ma_noi_bo: string;
  ten_hang_hoa: string;
  ten_hoa_don: string | null;
  dvt: string | null;
  gia_ban: number | null;
  gia_thung: number | null;
  quy_cach: string | null;
  ty_le: number | null;
  dvt_cap_2: string | null;   // Đơn vị cấp 2 (Hộp) — chỉ dùng cho sản phẩm bán 3 cấp Gói/Túi → Hộp → Thùng
  ty_le_cap_2: number | null; // Tỷ lệ quy đổi cấp 2 (Gói/Túi → Hộp)
  gia_hop: number | null;    // Giá Hộp
  brand_id: string | null;
  brand?: { name: string } | null; // populated only when a query joins brand:brands(name)
  nha_cung_cap: string | null;
  ma_hang_hoa: string | null; // Mã hàng NCC — mã SKU riêng của nhà cung cấp, dùng để đối chiếu (khác ma_noi_bo, vốn dùng để định danh sản phẩm trong hệ thống)
  ma_vach: string | null;
  ma_thung: string | null;
  ma_nhom_thay_the: string | null;
  trang_thai: string | null;
  xuat_xu: string | null;
  category_sheet: string;
  updated_at: string;
  last_exported_at: string | null;
  is_draft: boolean;
  created_at: string | null; // null = sản phẩm cũ, thêm trước khi có cột này
  photo_url: string | null; // ảnh thật riêng SKU (Supabase Storage bucket "product-photos"), null = chưa có, storefront fallback ảnh danh mục
};

// Shape sent from the product create/edit form: same editable fields as
// Product, minus server-assigned ones, with `brand` as a plain name instead
// of `brand_id` (the API resolves-or-creates the brand row by name).
export type ProductInput = Omit<
  Product,
  "id" | "brand_id" | "brand" | "updated_at" | "last_exported_at" | "is_draft" | "created_at" | "photo_url"
> & {
  brand: string | null;
};

export type RequestStatus = "pending" | "approved" | "rejected";

export type PriceChangeRequest = {
  id: string;
  product_id: string;
  proposed_gia_ban: number | null;
  proposed_gia_thung: number | null;
  proposed_by: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  note: string | null;
  created_at: string;
  product?: { ten_hang_hoa: string; ma_noi_bo: string; gia_ban: number | null; gia_thung: number | null } | null;
  proposer?: { display_name: string | null; username: string | null } | null;
};

export type PriceHistoryEntry = {
  id: string;
  product_id: string;
  gia_ban_old: number | null;
  gia_ban_new: number | null;
  gia_thung_old: number | null;
  gia_thung_new: number | null;
  changed_at: string;
  product?: { ten_hang_hoa: string; ma_noi_bo: string } | null;
};

export type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  display_name: string | null;
  role: "sales" | "accountant" | "admin" | "staff" | "shipper" | null;
  must_change_password: boolean;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type Notification = {
  id: string;
  recipient_id: string;
  activity_id: string | null;
  message: string;
  link_view: string | null;
  read_at: string | null;
  created_at: string;
};

export const CATEGORY_ORDER = [
  "Trà", "Sữa tươi", "Sữa đặc", "Kem đông lạnh", "Syrup", "Bột",
  "Trân châu", "Mứt", "Đồ lon", "Mặt hàng khác", "Công cụ dụng cụ",
];

// Khớp đúng schema `orders`/`order_items` ở
// supabase/migrations/001_orders_and_public_products.sql (đơn đặt từ web
// public, nhân sự nội bộ xem/cập nhật qua OrdersView).
export type OrderStatus = "cho_thanh_toan" | "da_thanh_toan" | "dang_xu_ly" | "dang_giao" | "hoan_thanh" | "huy";
export type PaymentMethod = "chuyen_khoan" | "cod";

export type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  note: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  created_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  shipper_id: string | null;
};

// Ghi lại THẬT mỗi lần đổi trạng thái đơn — xem
// supabase/migrations/007_shipper_and_status_history.sql. Dùng cho khối
// "Dòng thời gian" ở panel chi tiết OrdersView.
export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_at: string;
  changed_by: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  ten_hang_hoa: string;
  don_vi: string;
  don_gia: number;
  so_luong: number;
  thanh_tien: number;
};
