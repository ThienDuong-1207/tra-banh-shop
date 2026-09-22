import type { Coupon } from "./types";

export type CouponValidation = { valid: true; discountAmount: number } | { valid: false; reason: string };

// Hàm thuần (pure) — dùng CHUNG ở cả client (CheckoutForm, kiểm tra nhanh
// để hiện "Áp dụng" trước khi gửi đơn) lẫn server (actions.ts, lần kiểm
// tra thật quyết định số tiền cuối cùng). Viết 1 chỗ duy nhất để 2 nơi
// không bao giờ lệch logic — client chỉ là xem trước, server luôn tính lại
// từ đầu, không tin số client gửi lên (đúng nguyên tắc đã áp dụng cho giá
// sản phẩm trong createOrder).
export function validateCoupon(coupon: Coupon, orderSubtotal: number, now: Date = new Date()): CouponValidation {
  if (!coupon.active) return { valid: false, reason: "Mã đã ngừng áp dụng." };
  if (coupon.starts_at && now < new Date(coupon.starts_at)) {
    return { valid: false, reason: "Mã chưa tới ngày áp dụng." };
  }
  if (coupon.expires_at && now > new Date(coupon.expires_at)) {
    return { valid: false, reason: "Mã đã hết hạn." };
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, reason: "Mã đã hết lượt sử dụng." };
  }
  if (orderSubtotal < coupon.min_order_amount) {
    return { valid: false, reason: `Đơn tối thiểu ${coupon.min_order_amount.toLocaleString("vi-VN")}đ mới áp dụng được mã này.` };
  }
  const rawDiscount = coupon.discount_type === "percent" ? (orderSubtotal * coupon.discount_value) / 100 : coupon.discount_value;
  const discountAmount = Math.min(Math.round(rawDiscount), orderSubtotal);
  return { valid: true, discountAmount };
}
