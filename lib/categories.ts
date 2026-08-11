// Khớp đúng category_sheet đang dùng trong misa-price-manager (mục 16 của
// brief thiết kế) — Công cụ dụng cụ không phải hàng bán lẻ cho khách web
// nên không đưa vào danh mục nhanh của trang chủ.
export const CATEGORY_ORDER = [
  "Trà",
  "Sữa tươi",
  "Sữa đặc",
  "Kem đông lạnh",
  "Syrup",
  "Bột",
  "Trân châu",
  "Mứt",
  "Đồ lon",
  "Mặt hàng khác",
];

export function categorySlug(category: string): string {
  return encodeURIComponent(category);
}
