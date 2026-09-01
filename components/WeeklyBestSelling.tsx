"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { PublicProduct } from "@/lib/types";

// products truyền vào đã sort theo category_sheet rồi tên (xem
// lib/products.ts getAllProducts) — nếu lấy thẳng products.slice(0, N) thì
// N sản phẩm đầu luôn rơi vào đúng 1 danh mục (vì cùng ảnh chất liệu theo
// danh mục nên trông như lặp ảnh y hệt nhau). Lấy xen kẽ round-robin giữa
// các danh mục để tab "Tất cả" luôn đa dạng ảnh/loại hàng ngay từ đầu.
function pickDiverse(products: PublicProduct[], limit: number): PublicProduct[] {
  const byCategory = new Map<string, PublicProduct[]>();
  for (const p of products) {
    const list = byCategory.get(p.category_sheet);
    if (list) list.push(p);
    else byCategory.set(p.category_sheet, [p]);
  }
  const lists = [...byCategory.values()];
  const result: PublicProduct[] = [];
  for (let i = 0; result.length < limit && lists.some((l) => i < l.length); i++) {
    for (const list of lists) {
      if (result.length >= limit) break;
      if (list[i]) result.push(list[i]);
    }
  }
  return result;
}

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
  const filtered = active ? products.filter((p) => p.category_sheet === active) : pickDiverse(products, 8);

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
          {filtered.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-10 text-center text-sm text-muted">Chưa có sản phẩm trong danh mục này.</div>
      )}
    </div>
  );
}
