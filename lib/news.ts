// Khung dữ liệu cho section "Tin tức & Mẹo pha chế" ở trang chủ — CHƯA có hệ
// thống bài viết/CMS thật, đây là placeholder nội dung chung chung (mẹo bảo
// quản/định lượng nguyên liệu) để giữ đúng cấu trúc trang, không phải tin
// tức/khuyến mãi giả có ngày tháng hay số liệu cụ thể. Thay bằng nội dung
// thật (và route bài viết riêng nếu cần) khi có.
export type NewsItem = {
  title: string;
  excerpt: string;
};

export const NEWS_ITEMS: NewsItem[] = [
  {
    title: "Cách bảo quản syrup sau khi mở nắp",
    excerpt: "Đậy kín, để nơi khô mát, tránh ánh nắng trực tiếp để giữ màu và hương vị syrup lâu hơn.",
  },
  {
    title: "Phân biệt sữa đặc và kem béo khi định lượng công thức",
    excerpt: "Hai nguyên liệu dễ nhầm vai trò trong công thức — tỉ lệ thay thế hợp lý khi thiếu hàng.",
  },
  {
    title: "Đặt hàng sỉ và lẻ khác nhau thế nào trên Trà & Bánh",
    excerpt: "Xem giá theo thùng ngay trên trang sản phẩm, không cần nhắn hỏi mới biết mức giá sỉ.",
  },
];
