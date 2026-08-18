"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CartBadge from "@/components/CartBadge";
import { MenuIcon, SearchIcon, XIcon } from "@/components/icons";

// Thanh điều hướng trên cùng — bố cục theo video tham khảo Gromuse: hamburger
// (mobile) + logo trái, ô tìm kiếm dạng pill ở giữa, liên hệ nhanh + giỏ hàng
// bên phải. Không có avatar tài khoản/lời hứa giao hàng giả như video gốc vì
// dự án chưa có đăng nhập khách hàng hay cam kết thời gian giao thật.
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-primary text-cream">
      <div className="mx-auto flex max-w-[var(--container-shop)] items-center gap-3 px-4 py-3 sm:gap-4">
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

        <form action="/san-pham" className="hidden flex-1 items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm sm:flex">
          <SearchIcon className="h-4.5 w-4.5 shrink-0 text-muted" />
          <label htmlFor="header-search" className="sr-only">
            Tìm sản phẩm
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
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

        <div className="flex-1 sm:hidden" />

        <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
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
          <form action="/san-pham" className="mb-3 flex items-center gap-2 rounded-full bg-white px-4 py-2">
            <SearchIcon className="h-4.5 w-4.5 shrink-0 text-muted" />
            <label htmlFor="header-search-mobile" className="sr-only">
              Tìm sản phẩm
            </label>
            <input
              id="header-search-mobile"
              name="q"
              type="search"
              placeholder="Tìm syrup, sữa, trân châu…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </form>
          <nav className="flex flex-col gap-1 text-sm font-medium">
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
