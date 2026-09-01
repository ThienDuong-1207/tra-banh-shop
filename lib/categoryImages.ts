// Ảnh minh hoạ chất liệu theo danh mục — dùng thay cho placeholder emoji 🍵
// cũ trên ProductCard, trang chi tiết sản phẩm và thẻ danh mục ở trang chủ.
// Vì `PublicProduct` (xem lib/types.ts) chưa có cột ảnh riêng cho từng sản
// phẩm, ta dùng 1-2 ảnh chất liệu thật đại diện cho mỗi category_sheet —
// trung thực hơn khối màu trơn/emoji, nhưng không giả vờ là ảnh chụp đúng
// sản phẩm đó. Toàn bộ URL đã được xác thực tồn tại (curl -I → 200, đúng
// content-type image/*) và xem trực tiếp nội dung trước khi đưa vào đây.
//
// Danh mục nào có nhiều SKU (Trà, Sữa tươi, Mứt, Đồ lon, Kem đông lạnh) được
// gán 2 ảnh biến thể — getCategoryImage chọn ổn định theo tên sản phẩm để
// các SKU khác nhau trong cùng danh mục không hiện đúng 1 pixel giống hệt
// nhau trên cùng một lưới.
export type CategoryImage = {
  url: string;
  alt: string;
};

export const CATEGORY_IMAGES: Record<string, CategoryImage[]> = {
  "Trà": [
    {
      url: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80",
      alt: "Trà pha nóng nhìn từ trên xuống, xung quanh là lá trà khô và thảo mộc",
    },
    {
      url: "https://images.unsplash.com/photo-1643606245626-3bb927ea8619?auto=format&fit=crop&w=1200&q=80",
      alt: "Muỗng gỗ múc trà khô bên cạnh bình trà thuỷ tinh đang pha",
    },
  ],
  "Sữa tươi": [
    {
      url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
      alt: "Sữa tươi đang được rót từ bình vào ly thuỷ tinh",
    },
    {
      url: "https://images.unsplash.com/photo-1639151082235-406d8eb262b9?auto=format&fit=crop&w=1200&q=80",
      alt: "Chai sữa tươi thuỷ tinh đặt cạnh ly sữa đầy trên bàn gỗ",
    },
  ],
  "Kem đông lạnh": [
    {
      url: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=1200&q=80",
      alt: "Quầy kem lạnh nhiều vị xếp trong khay inox",
    },
    {
      url: "https://images.unsplash.com/photo-1636696301991-3e176a6b77dc?auto=format&fit=crop&w=1200&q=80",
      alt: "Ba viên kem vị socola trong chén trắng trên nền vàng",
    },
  ],
  "Syrup": [
    {
      url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1200&q=80",
      alt: "Dãy hũ syrup/nước cốt trái cây nhiều màu xếp cạnh nhau",
    },
  ],
  "Bột": [
    {
      url: "https://images.unsplash.com/photo-1614897920852-72084376cd9b?auto=format&fit=crop&w=1200&q=80",
      alt: "Thìa gỗ đầy bột cacao bên cạnh socola vụn trên bàn gỗ",
    },
  ],
  "Trân châu": [
    {
      url: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=1200&q=80",
      alt: "Ly trà sữa trân châu với lớp hạt trân châu đen bên dưới",
    },
  ],
  "Mứt": [
    {
      url: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=80",
      alt: "Trái cây tươi nhiều loại — nguyên liệu làm mứt/syrup trái cây",
    },
    {
      url: "https://images.unsplash.com/photo-1633084426862-3a8c25aa7ce5?auto=format&fit=crop&w=1200&q=80",
      alt: "Hũ mứt trái cây đặt trên thớt gỗ",
    },
  ],
  "Đồ lon": [
    {
      url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1200&q=80",
      alt: "Lon nước giải khát ướp lạnh trên đá",
    },
    {
      url: "https://images.unsplash.com/photo-1667504418981-e2099f9e346f?auto=format&fit=crop&w=1200&q=80",
      alt: "Nhìn từ trên xuống nhiều lon nước xếp thành hàng",
    },
  ],
  "Mặt hàng khác": [
    {
      url: "https://images.unsplash.com/photo-1683236030917-0552b3eb8c00?auto=format&fit=crop&w=1200&q=80",
      alt: "Trái dừa tươi và lá dừa trên nền nâu ấm",
    },
  ],
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

// Băm chuỗi ổn định (không dùng cho bảo mật) để chọn cùng 1 biến thể ảnh cho
// cùng 1 sản phẩm mỗi lần render, thay vì random — tránh ảnh "nhảy" giữa các
// lần load lại trang.
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getCategoryImage(category: string, seed?: string): CategoryImage | null {
  const variants = CATEGORY_IMAGES[category];
  if (!variants || variants.length === 0) return null;
  if (!seed) return variants[0];
  return variants[stableHash(seed) % variants.length];
}
