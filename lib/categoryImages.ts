// Ảnh minh hoạ chất liệu theo danh mục — dùng thay cho placeholder emoji 🍵
// cũ trên ProductCard, trang chi tiết sản phẩm và thẻ danh mục ở trang chủ.
// Vì `PublicProduct` (xem lib/types.ts) chưa có cột ảnh riêng cho từng sản
// phẩm, ta dùng MỘT ảnh chất liệu thật đại diện cho mỗi category_sheet —
// trung thực hơn khối màu trơn/emoji, nhưng không giả vờ là ảnh chụp đúng
// sản phẩm đó. Toàn bộ URL đã được xác thực tồn tại (curl -I → 200, đúng
// content-type image/*) và xem trực tiếp nội dung trước khi đưa vào đây.
export type CategoryImage = {
  url: string;
  alt: string;
};

export const CATEGORY_IMAGES: Record<string, CategoryImage> = {
  "Trà": {
    url: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80",
    alt: "Trà pha nóng nhìn từ trên xuống, xung quanh là lá trà khô và thảo mộc",
  },
  "Sữa tươi": {
    url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
    alt: "Sữa tươi đang được rót từ bình vào ly thuỷ tinh",
  },
  "Kem đông lạnh": {
    url: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=1200&q=80",
    alt: "Quầy kem lạnh nhiều vị xếp trong khay inox",
  },
  "Syrup": {
    url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1200&q=80",
    alt: "Dãy hũ syrup/nước cốt trái cây nhiều màu xếp cạnh nhau",
  },
  "Bột": {
    url: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1200&q=80",
    alt: "Bánh cuộn phủ lớp bột/đường phấn nhìn từ trên xuống",
  },
  "Trân châu": {
    url: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1200&q=80",
    alt: "Ly trà sữa trân châu với lớp hạt trân châu đen bên dưới",
  },
  "Mứt": {
    url: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80",
    alt: "Trái cây tươi nhiều loại — nguyên liệu làm mứt/syrup trái cây",
  },
  "Đồ lon": {
    url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80",
    alt: "Lon nước giải khát ướp lạnh trên đá",
  },
  "Mặt hàng khác": {
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    alt: "Các ổ bánh mì nướng nguyên cám xếp cạnh nhau",
  },
};

// Ảnh hero trang chủ — sữa bắn tung toé khi rót, thể hiện chất liệu nguyên
// liệu pha chế tươi mới. Đã xác thực tồn tại (curl -I → 200 image/jpeg).
export const HERO_IMAGE: CategoryImage = {
  url: "https://images.unsplash.com/photo-1600788907416-456578634209?auto=format&fit=crop&w=1600&q=80",
  alt: "Sữa tươi bắn tung toé khi rót vào ly trên nền tối",
};

// "Sữa đặc" chưa xác thực được ảnh Unsplash nào đúng chủ đề (đã thử nhiều
// photo ID, không ra ảnh đúng nội dung) — cố tình KHÔNG gán ảnh đoán bừa,
// dùng biến thể không ảnh (nền tông ink + typography) ở nơi hiển thị thay
// vì bịa ảnh sai ngữ cảnh.
export function getCategoryImage(category: string): CategoryImage | null {
  return CATEGORY_IMAGES[category] ?? null;
}
