"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { CartIcon } from "@/components/icons";

export default function CartBadge() {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();

  // Desktop (≥640px, đủ chỗ cho drawer): mở nhanh cart drawer thay vì điều
  // hướng. Mobile: vẫn là <Link> thường tới /gio-hang — giữ hành vi hoạt
  // động cả khi JS chưa chạy xong, và drawer full-width trên màn hình nhỏ
  // không mang lại lợi ích tốc độ so với trang riêng.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches) {
      e.preventDefault();
      open();
    }
  };

  return (
    <Link
      href="/gio-hang"
      onClick={handleClick}
      aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
      className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-primary-dark"
    >
      <CartIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Giỏ hàng</span>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-ink">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
