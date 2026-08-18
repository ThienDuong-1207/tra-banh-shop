"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatVnd } from "@/lib/products";
import { ArrowLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { createOrder } from "@/app/(site)/thanh-toan/actions";

export default function CheckoutForm({ errorMessage }: { errorMessage: string | null }) {
  const { items, totalAmount, updateQty, removeItem } = useCart();
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Chưa có gì để thanh toán</h1>
        <p className="mt-2 text-muted">Giỏ hàng của bạn đang trống.</p>
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-primary">
          Trà &amp; Bánh
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <Link href="/gio-hang" className="hover:text-primary">
          Giỏ hàng
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-ink">Thanh toán</span>
      </nav>
      <Link href="/gio-hang" className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Quay lại giỏ hàng
      </Link>

      {errorMessage && (
        <div className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary-dark" role="alert">
          {errorMessage}
        </div>
      )}

      <form
        action={createOrder}
        onSubmit={() => setSubmitting(true)}
        className="mt-6 grid gap-6 lg:grid-cols-5 lg:items-start"
      >
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Thông tin giao hàng */}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
            <h2 className="text-lg font-bold text-ink">Thông tin giao hàng</h2>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Họ và tên *
                <input
                  required
                  name="customer_name"
                  autoComplete="name"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Số điện thoại *
                <input
                  required
                  name="customer_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Địa chỉ giao hàng
                <input
                  name="customer_address"
                  autoComplete="street-address"
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Ghi chú
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Giờ giao hàng mong muốn, ghi chú khác…"
                  className="resize-none rounded-xl border border-black/10 bg-white px-4 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          </div>

          {/* Sản phẩm trong đơn hàng — không có khái niệm "nhiều cửa hàng" như
              layout tham khảo (site 1 nhà cung cấp), nhưng stepper số lượng
              là thật, tái dùng đúng logic đã có ở /gio-hang (updateQty). */}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
            <h2 className="text-lg font-bold text-ink">Sản phẩm trong đơn hàng</h2>
            <div className="mt-4 divide-y divide-black/5">
              {items.map((item) => (
                <div
                  key={`${item.product_id}:${item.don_vi}`}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="line-clamp-2 font-semibold text-ink">{item.ten_hang_hoa}</span>
                    <span className="text-sm text-muted">
                      {item.don_vi === "thung" ? "Đơn vị: thùng" : "Đơn vị: lẻ"} · {formatVnd(item.don_gia)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 sm:shrink-0">
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
                    <span className="w-24 shrink-0 text-right font-semibold text-ink">
                      {formatVnd(item.don_gia * item.so_luong)}
                    </span>
                    <button
                      type="button"
                      aria-label="Xóa sản phẩm"
                      onClick={() => removeItem(item.product_id, item.don_vi)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-alt hover:text-primary"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-2xl bg-white p-5 ring-1 ring-black/5 lg:sticky lg:top-24 lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Tóm tắt đơn hàng</h2>

          <div className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary-dark">
            <span className="font-semibold">Thanh toán qua VietQR.</span> Sau khi đặt hàng, mã QR kèm đúng
            số tiền sẽ hiện ra ở bước tiếp theo — chỉ cần quét bằng app ngân hàng để chuyển khoản.
          </div>

          <div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-lg font-bold text-ink">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatVnd(totalAmount)}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-cream transition hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Đang tạo đơn…" : "Đặt hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
