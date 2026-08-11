"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatVnd } from "@/lib/products";
import { MinusIcon, PlusIcon } from "@/components/icons";
import type { CartItem, PublicProduct } from "@/lib/types";

export default function ProductPurchasePanel({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const router = useRouter();
  const hasThung = product.gia_thung != null && !!product.quy_cach;
  const [donVi, setDonVi] = useState<CartItem["don_vi"]>("le");
  const [soLuong, setSoLuong] = useState(1);

  if (product.gia_ban == null) return null;

  const donGia = donVi === "thung" && product.gia_thung != null ? product.gia_thung : product.gia_ban;

  const buildItem = (): CartItem => ({
    product_id: product.id,
    ten_hang_hoa: product.ten_hang_hoa,
    don_vi: donVi,
    don_gia: donGia,
    so_luong: soLuong,
  });

  return (
    <div className="mt-6 flex flex-col gap-4">
      {hasThung && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDonVi("le")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              donVi === "le" ? "bg-primary text-cream" : "bg-warm-beige text-ink hover:bg-peach"
            }`}
          >
            Lẻ {product.dvt ? `(${product.dvt})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setDonVi("thung")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              donVi === "thung" ? "bg-primary text-cream" : "bg-warm-beige text-ink hover:bg-peach"
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
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-warm-beige"
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
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-warm-beige"
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
    </div>
  );
}
