import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import { ArrowLeftIcon } from "@/components/icons";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const zaloMessage = encodeURIComponent(`Chào shop, tôi muốn hỏi về: ${product.ten_hang_hoa}`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/san-pham" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-3xl bg-cream text-6xl ring-1 ring-black/5">
          🍵
        </div>

        <div className="flex flex-col">
          {product.brand_name && <span className="text-sm text-muted">{product.brand_name}</span>}
          <h1 className="mt-1 text-2xl font-bold text-ink">{product.ten_hang_hoa}</h1>
          <span className="mt-1 text-sm text-muted">{product.category_sheet}</span>

          <ProductPurchasePanel product={product} />

          <a
            href={`https://zalo.me/0906363395?text=${zaloMessage}`}
            className="mt-4 text-center text-sm text-muted underline hover:text-primary"
          >
            Cần tư vấn thêm? Nhắn Zalo cho shop
          </a>
        </div>
      </div>
    </div>
  );
}
