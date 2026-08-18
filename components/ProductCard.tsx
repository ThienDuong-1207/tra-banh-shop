import Image from "next/image";
import Link from "next/link";
import { formatVnd } from "@/lib/products";
import { getCategoryImage } from "@/lib/categoryImages";
import type { PublicProduct } from "@/lib/types";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product, priority = false }: { product: PublicProduct; priority?: boolean }) {
  const image = getCategoryImage(product.category_sheet);
  const hasThung = product.gia_thung != null && !!product.quy_cach;

  return (
    <Link
      href={`/san-pham/${product.id}`}
      className="group flex h-full w-full flex-col rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-alt">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 19vw, (min-width: 640px) 30vw, 45vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-ink/50">
            {product.category_sheet}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink sm:text-base">
          {product.ten_hang_hoa}
          {product.brand_name && <span className="font-normal text-muted"> ({product.brand_name})</span>}
        </h3>
        {(product.quy_cach || product.dvt) && (
          <span className="text-xs text-muted">{product.quy_cach ?? product.dvt}</span>
        )}
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-bold text-primary">{formatVnd(product.gia_ban)}</span>
          {product.dvt && <span className="text-xs text-muted">/ {product.dvt}</span>}
        </div>
        {hasThung && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className="font-semibold text-ink">{formatVnd(product.gia_thung)}</span>
            <span>/ thùng ({product.quy_cach})</span>
          </div>
        )}
        <div className="mt-auto pt-3">
          <AddToCartButton product={product} />
        </div>
      </div>
    </Link>
  );
}
