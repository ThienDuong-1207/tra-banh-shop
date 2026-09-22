import type { NextConfig } from "next";

// Hostname Supabase Storage cho ảnh sản phẩm thật (bucket "product-photos",
// public — xem supabase/migrations/004_product_photos.sql) — suy ra từ
// NEXT_PUBLIC_SUPABASE_URL thay vì hardcode ref dự án, để không lệch giữa
// các môi trường (local/preview/production dùng project Supabase khác nhau).
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

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
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
