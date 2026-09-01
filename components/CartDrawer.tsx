"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { formatVnd } from "@/lib/products";
import { getCategoryImage } from "@/lib/categoryImages";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";

// Drawer giỏ hàng trượt từ phải — mở nhanh khi bấm CartBadge ở Header trên
// desktop, dùng chung useCart() (không có state giỏ hàng riêng). Trang
// /gio-hang đầy đủ vẫn giữ nguyên cho mobile và link trực tiếp.
//
// Luôn render trong DOM (không unmount khi đóng) để CSS transition
// (translate-x) chạy được theo đúng nghĩa "trượt" — trạng thái đóng/mở chỉ
// đổi bằng class + `inert`, không cần state "đã vào" riêng trong effect.
export default function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const { items, itemCount, totalAmount, updateQty, removeItem } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!isOpen} inert={!isOpen}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Đóng giỏ hàng"
        onClick={close}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 motion-reduce:transition-none ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Giỏ hàng"
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 motion-reduce:transition-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Giỏ hàng{itemCount > 0 ? ` (${itemCount})` : ""}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Đóng giỏ hàng"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-alt"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <CartIcon className="h-10 w-10 text-muted" />
            <p className="text-muted">Giỏ hàng đang trống.</p>
            <Link
              href="/san-pham"
              onClick={close}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-cta px-6 py-2.5 text-sm font-semibold text-ink hover:bg-cta-hover"
            >
              Xem sản phẩm
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-black/5 overflow-y-auto px-5">
              {items.map((item) => {
                const image = getCategoryImage(item.category_sheet ?? "", item.ten_hang_hoa);
                return (
                <li key={`${item.product_id}:${item.don_vi}`} className="flex gap-3 py-4">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-alt">
                    {image && <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold text-ink">{item.ten_hang_hoa}</span>
                    <button
                      type="button"
                      aria-label={`Xoá ${item.ten_hang_hoa} khỏi giỏ`}
                      onClick={() => removeItem(item.product_id, item.don_vi)}
                      className="shrink-0 text-muted transition hover:text-primary"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-black/10">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => updateQty(item.product_id, item.don_vi, item.so_luong - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-surface-alt"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-ink" aria-live="polite">
                        {item.so_luong}
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => updateQty(item.product_id, item.don_vi, item.so_luong + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-surface-alt"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-ink">{formatVnd(item.don_gia * item.so_luong)}</span>
                  </div>
                  </div>
                </li>
                );
              })}
            </ul>
            <div className="border-t border-black/10 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Tổng cộng</span>
                <span className="text-lg font-bold text-primary">{formatVnd(totalAmount)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/thanh-toan"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-primary-dark"
                >
                  Thanh toán
                </Link>
                <Link
                  href="/gio-hang"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-alt"
                >
                  Xem giỏ hàng đầy đủ
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
