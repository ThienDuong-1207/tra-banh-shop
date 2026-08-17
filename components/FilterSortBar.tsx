"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CATEGORY_ORDER, categorySlug } from "@/lib/categories";
import { SortIcon } from "@/components/icons";

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

  return (
    <div className="sticky top-16 z-30 w-full border-b border-black/10 bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={pathname}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !category ? "bg-primary text-cream" : "bg-surface-alt text-ink hover:bg-neutral-200"
            }`}
          >
            Tất cả
          </Link>
          {CATEGORY_ORDER.map((c) => (
            <Link
              key={c}
              href={`${pathname}?category=${categorySlug(c)}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === c ? "bg-primary text-cream" : "bg-surface-alt text-ink hover:bg-neutral-200"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-surface-alt p-1 text-sm">
            <button
              type="button"
              onClick={() => pushParams({ don_vi: null })}
              className={`rounded-full px-3 py-1 font-medium transition ${
                !donVi ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Tất cả đơn vị
            </button>
            {(Object.keys(UNIT_LABEL) as UnitFilter[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => pushParams({ don_vi: u })}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  donVi === u ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {UNIT_LABEL[u]}
              </button>
            ))}
          </div>

          <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5 text-sm">
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
              className="w-24 rounded-full border border-black/10 bg-white px-3 py-1.5 outline-none focus:border-primary"
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
              className="w-24 rounded-full border border-black/10 bg-white px-3 py-1.5 outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-full bg-surface-alt px-3 py-1.5 font-medium text-ink transition hover:bg-neutral-200"
            >
              Lọc giá
            </button>
          </form>

          <label className="ml-auto flex items-center gap-1.5 text-sm text-ink">
            <SortIcon className="h-4 w-4 text-muted" aria-hidden />
            <span className="sr-only">Sắp xếp</span>
            <select
              value={sort ?? ""}
              onChange={(e) => pushParams({ sort: e.target.value || null })}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 outline-none focus:border-primary"
            >
              <option value="">Mặc định</option>
              {(Object.keys(SORT_LABEL) as SortOption[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="text-sm font-medium text-muted underline hover:text-primary"
            >
              Xoá lọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
