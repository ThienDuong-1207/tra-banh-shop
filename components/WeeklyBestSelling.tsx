"use client";

import { useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
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
  const trackRef = useRef<HTMLDivElement>(null);

  // Cuộn theo đúng 1 "màn hình" thẻ đang hiển thị (chiều rộng khung nhìn),
  // không cuộn theo số px cố định — khớp với mọi breakpoint (2/3/4 thẻ).
  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

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
        <div className="relative mt-6">
          {/* Carousel cuộn ngang — mỗi thẻ giữ đúng chiều rộng như lưới
              2/3/4 cột cũ (breakpoint tương ứng), chỉ đổi cách hiển thị từ
              lưới tĩnh sang cuộn ngang + nút mũi tên để xem hết 8 sản phẩm
              mà không cần rời trang. */}
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth sm:gap-4"
          >
            {filtered.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {filtered.length > 4 && (
            <>
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                aria-label="Xem sản phẩm trước"
                className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md ring-1 ring-black/10 transition hover:bg-surface-alt sm:flex"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                aria-label="Xem sản phẩm tiếp theo"
                className="absolute right-0 top-1/2 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md ring-1 ring-black/10 transition hover:bg-surface-alt sm:flex"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-10 text-center text-sm text-muted">Chưa có sản phẩm trong danh mục này.</div>
      )}
    </div>
  );
}
