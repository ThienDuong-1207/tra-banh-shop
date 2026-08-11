import Link from "next/link";
import { formatVnd } from "@/lib/products";
import type { PublicProduct } from "@/lib/types";

export default function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <Link
      href={`/san-pham/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-cream text-4xl">🍵</div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brand_name && <span className="text-xs text-muted">{product.brand_name}</span>}
        <h3 className="line-clamp-2 font-semibold text-ink">{product.ten_hang_hoa}</h3>
        {product.quy_cach && <span className="text-xs text-muted">{product.quy_cach}</span>}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold text-primary">{formatVnd(product.gia_ban)}</span>
          {product.dvt && <span className="text-xs text-muted">/ {product.dvt}</span>}
        </div>
      </div>
    </Link>
  );
}
