import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getProductsByCategory } from "@/lib/products";
import { getCategoryImage } from "@/lib/categoryImages";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductCard from "@/components/ProductCard";
import { ArrowLeftIcon } from "@/components/icons";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const image = getCategoryImage(product.category_sheet);
  const zaloMessage = encodeURIComponent(`Chào shop, tôi muốn hỏi về: ${product.ten_hang_hoa}`);

  const sameCategory = await getProductsByCategory(product.category_sheet);
  const related = sameCategory.filter((p) => p.id !== product.id).slice(0, 4);

  const specs: { label: string; value: string }[] = [
    { label: "Quy cách", value: product.quy_cach ?? "—" },
    { label: "Đơn vị", value: product.dvt ?? "—" },
    { label: "Danh mục", value: product.category_sheet },
    { label: "Thương hiệu", value: product.brand_name ?? "—" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-28 lg:pb-10">
      <Link href="/san-pham" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface-alt ring-1 ring-black/5">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-lg font-semibold text-ink/50">
              {product.category_sheet}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="flex flex-col">
            {product.brand_name && <span className="text-sm text-muted">{product.brand_name}</span>}
            <h1 className="mt-1 text-2xl font-bold text-ink">{product.ten_hang_hoa}</h1>
            <span className="mt-1 text-sm text-muted">{product.category_sheet}</span>
          </div>

          <ProductPurchasePanel product={product} />

          <a
            href={`https://zalo.me/0906363395?text=${zaloMessage}`}
            className="text-center text-sm text-muted underline hover:text-primary"
          >
            Cần tư vấn thêm? Nhắn Zalo cho shop
          </a>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-2xl border border-black/10 p-5 text-sm">
            {specs.map((s) => (
              <div key={s.label} className="contents">
                <dt className="text-muted">{s.label}</dt>
                <dd className="font-medium text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ink">Sản phẩm cùng danh mục</h2>
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
