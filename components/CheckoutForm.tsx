"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatVnd } from "@/lib/products";
import { ArrowLeftIcon } from "@/components/icons";
import { createOrder } from "@/app/(site)/thanh-toan/actions";

export default function CheckoutForm({ errorMessage }: { errorMessage: string | null }) {
  const { items, totalAmount } = useCart();
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Chưa có gì để thanh toán</h1>
        <p className="mt-2 text-muted">Giỏ hàng của bạn đang trống.</p>
        <Link
          href="/san-pham"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 font-semibold text-ink hover:bg-accent-hover"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/gio-hang" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Quay lại giỏ hàng
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink">Thông tin đặt hàng</h1>

      {errorMessage && (
        <div className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary-dark" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:items-start">
        <form
          action={createOrder}
          onSubmit={() => setSubmitting(true)}
          className="flex flex-col gap-4 lg:col-span-3"
        >
          <input type="hidden" name="items" value={JSON.stringify(items)} />

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

          <div className="rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary-dark">
            <span className="font-semibold">Thanh toán qua VietQR.</span> Sau khi đặt hàng, mã QR kèm đúng
            số tiền sẽ hiện ra ở bước tiếp theo — chỉ cần quét bằng app ngân hàng để chuyển khoản.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-cream transition hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Đang tạo đơn…" : "Đặt hàng"}
          </button>
        </form>

        <div className="h-fit rounded-2xl bg-surface-alt p-5 ring-1 ring-black/5 lg:sticky lg:top-24 lg:col-span-2">
          <h2 className="font-semibold text-ink">Đơn hàng của bạn</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={`${item.product_id}:${item.don_vi}`} className="flex justify-between gap-2 text-ink">
                <span className="line-clamp-1">
                  {item.ten_hang_hoa} <span className="text-muted">×{item.so_luong}</span>
                </span>
                <span className="shrink-0 font-medium">{formatVnd(item.don_gia * item.so_luong)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-black/10 pt-3 font-semibold text-ink">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatVnd(totalAmount)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">Thanh toán: chuyển khoản qua VietQR sau khi đặt hàng.</p>
        </div>
      </div>
    </div>
  );
}
