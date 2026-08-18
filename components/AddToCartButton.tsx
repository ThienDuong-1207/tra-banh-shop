"use client";

import { useCart } from "@/contexts/CartContext";
import { MinusIcon, PlusIcon } from "@/components/icons";
import type { PublicProduct } from "@/lib/types";

// Khay bo tròn ở đáy card sản phẩm — nút "+" khi chưa có trong giỏ, chuyển
// thành stepper "− số lượng +" khi đã thêm (theo đúng tương tác trong video
// tham khảo). Đọc/ghi trực tiếp qua useCart() — không giữ state số lượng
// riêng, tray luôn phản ánh đúng số lượng thật trong giỏ (đơn vị lẻ).
// Chặn nổi bọt sự kiện vì card được bọc trong <Link>.
export default function AddToCartButton({ product }: { product: PublicProduct }) {
  const { items, addItem, updateQty } = useCart();

  if (product.gia_ban == null) return null;

  const line = items.find((i) => i.product_id === product.id && i.don_vi === "le");
  const qty = line?.so_luong ?? 0;

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAdd = (e: React.MouseEvent) => {
    stop(e);
    addItem({
      product_id: product.id,
      ten_hang_hoa: product.ten_hang_hoa,
      don_vi: "le",
      don_gia: product.gia_ban!,
      so_luong: 1,
    });
  };

  const handleInc = (e: React.MouseEvent) => {
    stop(e);
    updateQty(product.id, "le", qty + 1);
  };

  const handleDec = (e: React.MouseEvent) => {
    stop(e);
    updateQty(product.id, "le", qty - 1);
  };

  if (qty > 0) {
    return (
      <div
        onClick={stop}
        className="flex w-full items-center justify-between rounded-full bg-cta px-2 py-1.5 text-ink"
      >
        <button
          type="button"
          aria-label={`Giảm số lượng ${product.ten_hang_hoa}`}
          onClick={handleDec}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 transition hover:bg-white"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-bold" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          aria-label={`Tăng số lượng ${product.ten_hang_hoa}`}
          onClick={handleInc}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 transition hover:bg-white"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={`Thêm ${product.ten_hang_hoa} vào giỏ`}
      className="flex w-full items-center justify-center rounded-full bg-cta-soft py-2 text-ink transition hover:bg-cta hover:text-ink"
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  );
}
