"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatVnd } from "@/lib/products";
import { getCategoryImage } from "@/lib/categoryImages";
import { CATEGORY_ORDER, categorySlug } from "@/lib/categories";
import { SearchIcon } from "@/components/icons";
import type { PublicProduct } from "@/lib/types";

// Ô tìm kiếm có gợi ý trực tiếp khi gõ (theo layout tham khảo Gromuse: 2 cột
// "Suggestions"/"Products") — thu gọn còn "Danh mục" (khớp CATEGORY_ORDER,
// không cần gọi API) + "Sản phẩm" (query trực tiếp public_products qua
// client Supabase, debounce 250ms). Không có khái niệm "Stores" như layout
// gốc vì đây là site 1 nhà cung cấp. Submit form vẫn hoạt động không cần JS
// (action="/san-pham", input name="q").
export default function SearchBox({ id, onNavigate }: { id: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const needle = query.trim().toLowerCase();
  const matchedCategories = needle ? CATEGORY_ORDER.filter((c) => c.toLowerCase().includes(needle)) : [];

  useEffect(() => {
    if (!needle) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { data } = await supabase
        .from("public_products")
        .select("id, ten_hang_hoa, mo_ta, category_sheet, dvt, gia_ban, quy_cach, gia_thung, brand_name")
        .ilike("ten_hang_hoa", `%${needle}%`)
        .limit(5);
      if (!cancelled) setProducts((data ?? []) as PublicProduct[]);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [needle]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const showDropdown = open && needle.length > 0;
  const hasResults = matchedCategories.length > 0 || products.length > 0;

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <form
        action="/san-pham"
        onSubmit={close}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm"
      >
        <SearchIcon className="h-4.5 w-4.5 shrink-0 text-muted" />
        <label htmlFor={id} className="sr-only">
          Tìm sản phẩm
        </label>
        <input
          id={id}
          name="q"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Tìm syrup, sữa, trân châu, bột…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-cream transition hover:bg-primary-dark"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl bg-white p-5 text-left shadow-lg ring-1 ring-black/10">
          {!hasResults ? (
            <p className="text-sm text-muted">Không tìm thấy kết quả phù hợp với &quot;{query}&quot;.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {matchedCategories.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Danh mục</h3>
                  <ul className="mt-2 flex flex-col">
                    {matchedCategories.map((c) => (
                      <li key={c}>
                        <Link
                          href={`/san-pham?category=${categorySlug(c)}`}
                          onClick={close}
                          className="block rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-surface-alt"
                        >
                          {c}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {products.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Sản phẩm</h3>
                  <ul className="mt-2 flex flex-col gap-1">
                    {products.map((p) => {
                      const image = getCategoryImage(p.category_sheet, p.ten_hang_hoa);
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/san-pham/${p.id}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-surface-alt"
                          >
                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
                              {image && <Image src={image.url} alt="" fill sizes="40px" className="object-cover" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">{p.ten_hang_hoa}</span>
                              <span className="text-xs font-semibold text-primary">{formatVnd(p.gia_ban)}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 border-t border-black/10 pt-3 text-center">
            <Link
              href={`/san-pham?q=${encodeURIComponent(query)}`}
              onClick={close}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Xem tất cả kết quả →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
