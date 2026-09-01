"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { PublicProduct } from "@/lib/types";

// Section "Bán chạy trong tuần" ở trang chủ — tab pill lọc theo danh mục
// (theo đúng UI trong video tham khảo). Lọc ngay trên dữ liệu đã fetch sẵn
// ở trang chủ (Server Component truyền xuống qua props), không gọi lại
// Supabase — khác với FilterSortBar ở /san-pham vốn cần query string để
// URL chia sẻ được, trang chủ không cần yêu cầu đó.
export default function WeeklyBestSelling({
  products,
  categories,
}: {
  products: PublicProduct[];
  categories: string[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = active ? products.filter((p) => p.category_sheet === active) : products;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active === null ? "bg-primary text-cream" : "bg-white text-ink ring-1 ring-black/10 hover:bg-surface-alt"
          }`}
        >
          Tất cả
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active === c ? "bg-primary text-cream" : "bg-white text-ink ring-1 ring-black/10 hover:bg-surface-alt"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.slice(0, 5).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-10 text-center text-sm text-muted">Chưa có sản phẩm trong danh mục này.</div>
      )}
    </div>
  );
}
