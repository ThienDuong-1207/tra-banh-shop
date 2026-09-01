"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CartBadge from "@/components/CartBadge";
import SearchBox from "@/components/SearchBox";
import { MenuIcon, XIcon } from "@/components/icons";

// Thanh điều hướng trên cùng — bố cục theo video tham khảo Gromuse: hamburger
// (mobile) + logo trái, ô tìm kiếm dạng pill ở giữa, liên hệ nhanh + giỏ hàng
// bên phải. Không có avatar tài khoản/lời hứa giao hàng giả như video gốc vì
// dự án chưa có đăng nhập khách hàng hay cam kết thời gian giao thật.
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-primary text-cream">
      <div className="mx-auto flex max-w-[var(--container-shop)] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10">
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
