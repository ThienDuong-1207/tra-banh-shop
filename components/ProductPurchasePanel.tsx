"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatVnd } from "@/lib/products";
import { MinusIcon, PlusIcon } from "@/components/icons";
import type { CartItem, PublicProduct } from "@/lib/types";

// Panel chọn số lượng + nút mua ở trang chi tiết sản phẩm — trang bọc
// component này trong cột "sticky buy-box" (position: sticky, dính khi
// cuộn trên desktop). Trên mobile, panel còn tự thêm một thanh giá + nút
// mua rút gọn dính đáy màn hình (fixed bottom bar) để luôn thao tác được
// dù đang cuộn xem bảng thông số/sản phẩm liên quan bên dưới.
export default function ProductPurchasePanel({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const router = useRouter();
  const hasThung = product.gia_thung != null && !!product.quy_cach;
  const [donVi, setDonVi] = useState<CartItem["don_vi"]>("le");
  const [soLuong, setSoLuong] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (product.gia_ban == null) return null;

  const donGia = donVi === "thung" && product.gia_thung != null ? product.gia_thung : product.gia_ban;

  const buildItem = (): CartItem => ({
    product_id: product.id,
    ten_hang_hoa: product.ten_hang_hoa,
    don_vi: donVi,
    don_gia: donGia,
    so_luong: soLuong,
  });

  const handleQuickAdd = () => {
    addItem(buildItem());
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div className="flex flex-col gap-4">
      {hasThung && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDonVi("le")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              donVi === "le" ? "bg-primary text-cream" : "bg-surface-alt text-ink hover:bg-neutral-200"
            }`}
          >
            Lẻ {product.dvt ? `(${product.dvt})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setDonVi("thung")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              donVi === "thung" ? "bg-primary text-cream" : "bg-surface-alt text-ink hover:bg-neutral-200"
            }`}
          >
            Thùng ({product.quy_cach})
          </button>
        </div>
      )}

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-primary">{formatVnd(donGia)}</span>
        <span className="text-muted">/ {donVi === "thung" ? "thùng" : product.dvt ?? "lẻ"}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-black/10">
          <button
            type="button"
            aria-label="Giảm số lượng"
            onClick={() => setSoLuong((n) => Math.max(1, n - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-alt"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-semibold text-ink" aria-live="polite">
            {soLuong}
          </span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            onClick={() => setSoLuong((n) => n + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-alt"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-muted">
          Thành tiền: <span className="font-semibold text-ink">{formatVnd(donGia * soLuong)}</span>
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => addItem(buildItem())}
          className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-primary px-8 py-3 font-semibold text-primary transition hover:bg-primary hover:text-cream"
        >
          Thêm vào giỏ
        </button>
        <button
          type="button"
          onClick={() => {
            addItem(buildItem());
            router.push("/gio-hang");
          }}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-accent px-8 py-3 font-semibold text-ink transition hover:bg-accent-hover"
        >
          Mua ngay
        </button>
      </div>

      {/* Thanh giá + nút mua rút gọn, dính đáy màn hình — chỉ hiện trên
          mobile/tablet (dưới lg dùng cột phải sticky ở trang chi tiết). */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-black/10 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-primary">{formatVnd(donGia)}</span>
          <span className="text-xs text-muted">/ {donVi === "thung" ? "thùng" : product.dvt ?? "lẻ"}</span>
        </div>
        <button
          type="button"
          onClick={handleQuickAdd}
          className={`inline-flex flex-1 max-w-56 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition motion-reduce:transition-none ${
            justAdded ? "bg-primary text-cream" : "bg-accent text-ink hover:bg-accent-hover"
          }`}
        >
          {justAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
        </button>
      </div>
    </div>
  );
}
