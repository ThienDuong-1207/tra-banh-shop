import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ảnh nguyên liệu (hero, danh mục, ảnh minh hoạ sản phẩm) lấy từ Unsplash
    // CDN — mỗi URL đã được xác thực (curl -I trả 200 + xem trực tiếp nội
    // dung) trước khi đưa vào code, xem lib/categoryImages.ts.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
