import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, formatVnd } from "@/lib/products";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const zaloMessage = encodeURIComponent(`Chào shop, tôi muốn đặt hàng: ${product.ten_hang_hoa}`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/san-pham" className="text-sm text-muted hover:text-primary">
        ← Quay lại danh sách
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-3xl bg-cream text-6xl ring-1 ring-black/5">
          🍵
        </div>

        <div className="flex flex-col">
          {product.brand_name && <span className="text-sm text-muted">{product.brand_name}</span>}
          <h1 className="mt-1 text-2xl font-bold text-ink">{product.ten_hang_hoa}</h1>
          <span className="mt-1 text-sm text-muted">{product.category_sheet}</span>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{formatVnd(product.gia_ban)}</span>
            {product.dvt && <span className="text-muted">/ {product.dvt}</span>}
          </div>

          {product.quy_cach && product.gia_thung != null && (
            <p className="mt-2 text-sm text-muted">
              Giá thùng ({product.quy_cach}): <span className="font-semibold text-ink">{formatVnd(product.gia_thung)}</span>
            </p>
          )}

          <a
            href={`https://zalo.me/0906363395?text=${zaloMessage}`}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 font-semibold text-ink hover:bg-accent-hover"
          >
            Đặt hàng qua Zalo
          </a>
          <p className="mt-2 text-xs text-muted">
            Website đang trong giai đoạn trưng bày — đặt hàng trực tuyến sẽ có sớm.
          </p>
        </div>
      </div>
    </div>
  );
}
