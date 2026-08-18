"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORY_ORDER } from "@/lib/categories";
import { ChevronDownIcon } from "@/components/icons";

type UnitFilter = "le" | "thung";
type SortOption = "gia-tang" | "gia-giam" | "ten-az";

const UNIT_LABEL: Record<UnitFilter, string> = { le: "Lẻ", thung: "Thùng" };
const SORT_LABEL: Record<SortOption, string> = {
  "gia-tang": "Giá tăng dần",
  "gia-giam": "Giá giảm dần",
  "ten-az": "Tên A–Z",
};

// Thanh lọc/sắp xếp dính (sticky) phía trên grid sản phẩm ở /san-pham —
// điều khiển bằng query string (?category=&don_vi=&gia_tu=&gia_den=&sort=)
// để trang chi tiết (Server Component) lọc/sắp xếp dữ liệu, không tự giữ
// state danh sách sản phẩm ở đây.
export default function FilterSortBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const donVi = searchParams.get("don_vi");
  const sort = searchParams.get("sort");
  const [minGia, setMinGia] = useState(searchParams.get("gia_tu") ?? "");
  const [maxGia, setMaxGia] = useState(searchParams.get("gia_den") ?? "");

  const pushParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ gia_tu: minGia || null, gia_den: maxGia || null });
  };

  const hasActiveFilter = Boolean(
    category || donVi || sort || searchParams.get("gia_tu") || searchParams.get("gia_den") || searchParams.get("q")
  );

  // Chip dạng dropdown (select native lồng trong pill bo tròn + chevron) —
  // đúng ngôn ngữ "All Categories ▾ / Price ▾ / Sort by ▾" của video, nhưng
  // dùng select thật (không phải menu giả) để giữ thao tác bàn phím/a11y.
  const chipClass = (active: boolean) =>
    `relative flex items-center gap-1.5 rounded-full py-1.5 pl-4 pr-8 text-sm font-medium ring-1 transition ${
      active ? "bg-primary text-cream ring-primary" : "bg-white text-ink ring-black/10 hover:bg-surface-alt"
    }`;

  return (
    <div className="sticky top-16 z-30 w-full border-b border-black/10 bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Danh mục</span>
          <select
            value={category}
            onChange={(e) => pushParams({ category: e.target.value || null })}
            className={`${chipClass(Boolean(category))} appearance-none`}
          >
            <option value="">Tất cả danh mục</option>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${category ? "text-cream" : "text-muted"}`}
          />
        </label>

        <label className="relative">
          <span className="sr-only">Đơn vị</span>
          <select
            value={donVi ?? ""}
            onChange={(e) => pushParams({ don_vi: e.target.value || null })}
            className={`${chipClass(Boolean(donVi))} appearance-none`}
          >
            <option value="">Tất cả đơn vị</option>
            {(Object.keys(UNIT_LABEL) as UnitFilter[]).map((u) => (
              <option key={u} value={u}>
                {UNIT_LABEL[u]}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${donVi ? "text-cream" : "text-muted"}`}
          />
        </label>

        <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-3 pr-1 text-sm ring-1 ring-black/10">
          <label className="sr-only" htmlFor="gia_tu">
            Giá từ
          </label>
          <input
            id="gia_tu"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Giá từ"
            value={minGia}
            onChange={(e) => setMinGia(e.target.value)}
            className="w-20 bg-transparent py-1 outline-none"
          />
          <span className="text-muted">–</span>
          <label className="sr-only" htmlFor="gia_den">
            Giá đến
          </label>
          <input
            id="gia_den"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Giá đến"
            value={maxGia}
            onChange={(e) => setMaxGia(e.target.value)}
            className="w-20 bg-transparent py-1 outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-surface-alt px-3 py-1.5 font-medium text-ink transition hover:bg-neutral-200"
          >
            Lọc giá
          </button>
        </form>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-sm font-medium text-muted underline hover:text-primary"
          >
            Xoá lọc
          </button>
        )}

        <label className="relative ml-auto">
          <span className="sr-only">Sắp xếp</span>
          <select
            value={sort ?? ""}
            onChange={(e) => pushParams({ sort: e.target.value || null })}
            className={`${chipClass(Boolean(sort))} appearance-none`}
          >
            <option value="">Sắp xếp: Mặc định</option>
            {(Object.keys(SORT_LABEL) as SortOption[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${sort ? "text-cream" : "text-muted"}`}
          />
        </label>
      </div>
    </div>
  );
}
