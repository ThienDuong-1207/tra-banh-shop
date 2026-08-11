"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { CartIcon, CheckCircleIcon } from "@/components/icons";
import type { PublicProduct } from "@/lib/types";

// Nút thêm nhanh 1 sản phẩm (đơn vị lẻ) — dùng trên card sản phẩm ở trang
// chủ/danh mục. Chặn nổi bọt sự kiện vì card được bọc trong <Link>.
export default function AddToCartButton({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  if (product.gia_ban == null) return null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      ten_hang_hoa: product.ten_hang_hoa,
      don_vi: "le",
      don_gia: product.gia_ban!,
      so_luong: 1,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={justAdded ? "Đã thêm vào giỏ" : `Thêm ${product.ten_hang_hoa} vào giỏ`}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition motion-reduce:transition-none ${
        justAdded ? "bg-primary text-cream" : "bg-accent text-ink hover:bg-accent-hover"
      }`}
    >
      {justAdded ? <CheckCircleIcon className="h-4 w-4" /> : <CartIcon className="h-4 w-4" />}
      <span className="hidden sm:inline">{justAdded ? "Đã thêm" : "Thêm"}</span>
    </button>
  );
}
