"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CartBadge from "@/components/CartBadge";
import SearchBox from "@/components/SearchBox";
import { CATEGORY_ORDER, categorySlug } from "@/lib/categories";
import { ChevronDownIcon, MenuIcon, XIcon } from "@/components/icons";

// Thanh điều hướng trên cùng — bố cục theo video tham khảo Gromuse: hamburger
// (mobile) + logo trái, ô tìm kiếm dạng pill ở giữa, liên hệ nhanh + giỏ hàng
// bên phải. Không có avatar tài khoản/lời hứa giao hàng giả như video gốc vì
// dự án chưa có đăng nhập khách hàng hay cam kết thời gian giao thật.
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const catMenuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown "Danh mục" khi click ra ngoài hoặc nhấn Esc — dropdown chỉ
  // chứa link điều hướng, không cần roving-tabindex kiểu ARIA menu đầy đủ.
  useEffect(() => {
    if (!catMenuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCatMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setCatMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [catMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-primary text-cream">
      <div className="mx-auto flex max-w-[var(--container-shop)] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-15">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-primary-dark sm:hidden"
        >
          {menuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>

        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="Trà & Bánh"
            width={124}
            height={40}
            style={{ height: "auto" }}
            className="h-9 w-auto rounded-lg sm:h-10"
            priority
          />
        </Link>

        <div className="hidden flex-1 sm:block">
          <SearchBox id="header-search" />
        </div>

        <div className="flex-1 sm:hidden" />

        <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
          <div ref={catMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setCatMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={catMenuOpen}
              className="flex items-center gap-1 hover:text-accent"
            >
              Danh mục
              <ChevronDownIcon className={`h-3.5 w-3.5 transition ${catMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {catMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-[420px] rounded-2xl bg-white p-3 text-ink shadow-lg ring-1 ring-black/10">
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORY_ORDER.map((c) => (
                    <Link
                      key={c}
                      href={`/san-pham?category=${categorySlug(c)}`}
                      onClick={() => setCatMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm hover:bg-surface-alt"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/san-pham" className="hover:text-accent">
            Sản phẩm
          </Link>
          <a href="https://zalo.me/0906363395" className="hover:text-accent">
            Zalo: 0906.363.395
          </a>
        </nav>
        <CartBadge />
      </div>

      {menuOpen && (
        <div className="border-t border-cream/10 px-4 py-3 sm:hidden">
          <div className="mb-3">
            <SearchBox id="header-search-mobile" onNavigate={() => setMenuOpen(false)} />
          </div>

          <div className="mb-3">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-cream/60">
              Danh mục sản phẩm
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {CATEGORY_ORDER.map((c) => (
                <Link
                  key={c}
                  href={`/san-pham?category=${categorySlug(c)}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm hover:bg-primary-dark"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          <nav className="flex flex-col gap-1 border-t border-cream/10 pt-3 text-sm font-medium">
            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-primary-dark">
              Trang chủ
            </Link>
            <Link href="/san-pham" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 hover:bg-primary-dark">
              Sản phẩm
            </Link>
            <a href="https://zalo.me/0906363395" className="rounded-lg px-2 py-2 hover:bg-primary-dark">
              Liên hệ Zalo: 0906.363.395
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
