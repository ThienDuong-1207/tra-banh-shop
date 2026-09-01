"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatVnd } from "@/lib/products";
import { getCategoryImage } from "@/lib/categoryImages";
import { ArrowLeftIcon, CartIcon, ChevronRightIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function CartPage() {
  const { items, totalAmount, updateQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
        <CartIcon className="h-12 w-12 text-muted" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-muted">Chọn nguyên liệu bạn cần rồi quay lại đây để đặt hàng.</p>
        <Link
          href="/san-pham"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-cta px-8 py-3 font-semibold text-ink hover:bg-cta-hover"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-primary">
          Trà &amp; Bánh
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-ink">Giỏ hàng</span>
      </nav>
      <Link href="/san-pham" className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Tiếp tục mua hàng
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink">Giỏ hàng của bạn</h1>

      <div className="mt-6 divide-y divide-black/5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {items.map((item) => {
          const image = getCategoryImage(item.category_sheet ?? "", item.ten_hang_hoa);
          return (
          <div key={`${item.product_id}:${item.don_vi}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <span className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-alt sm:block">
              {image && <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="line-clamp-2 font-semibold text-ink">{item.ten_hang_hoa}</span>
              <span className="text-sm text-muted">
                {item.don_vi === "thung" ? "Đơn vị: thùng" : "Đơn vị: lẻ"} · {formatVnd(item.don_gia)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 sm:shrink-0 sm:justify-end">
              <div className="flex items-center rounded-full border border-black/10">
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  onClick={() => updateQty(item.product_id, item.don_vi, item.so_luong - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface-alt"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-ink" aria-live="polite">
                  {item.so_luong}
                </span>
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  onClick={() => updateQty(item.product_id, item.don_vi, item.so_luong + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface-alt"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="shrink-0 text-right font-semibold text-ink">
                {formatVnd(item.don_gia * item.so_luong)}
              </span>

              <button
                type="button"
                aria-label={`Xoá ${item.ten_hang_hoa} khỏi giỏ`}
                onClick={() => removeItem(item.product_id, item.don_vi)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-primary/10 hover:text-primary"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-end gap-4 rounded-2xl bg-surface-alt p-5 ring-1 ring-black/5">
        <div className="flex items-baseline gap-3">
          <span className="text-muted">Tổng cộng</span>
          <span className="text-2xl font-bold text-primary">{formatVnd(totalAmount)}</span>
        </div>
        <Link
          href="/thanh-toan"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-cream transition hover:bg-primary-dark"
        >
          Tiến hành thanh toán
        </Link>
      </div>
    </div>
  );
}
