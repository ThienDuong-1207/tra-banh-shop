import "./globals.css";

export const metadata = {
  title: "Quản lý giá - Tiệm Trà Bánh",
  description: "Quản lý giá sản phẩm và xuất file MISA / bảng giá 7.7x4cm",
};

// Root layout riêng cho khu vực /admin — cố ý KHÔNG dùng chung
// app/(site)/layout.tsx (không có Header/Footer công khai của shop, không
// dùng font/Tailwind của shop). Route group (admin) + (site) là 2 "root
// layout" song song theo đúng pattern chính thức của Next.js App Router
// (Multiple Root Layouts), nên URL không đổi (/admin/..., /, /san-pham...)
// dù file được tổ chức trong 2 group khác nhau.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
