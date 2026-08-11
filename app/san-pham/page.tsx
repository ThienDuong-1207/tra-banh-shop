import Link from "next/link";
import { getAllProducts, getProductsByCategory } from "@/lib/products";
import { CATEGORY_ORDER } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = category ? await getProductsByCategory(category) : await getAllProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Sản phẩm</h1>
      <p className="mt-1 text-sm text-muted">{products.length} sản phẩm</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/san-pham"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !category ? "bg-primary text-cream" : "bg-warm-beige text-ink hover:bg-peach"
          }`}
        >
          Tất cả
        </Link>
        {CATEGORY_ORDER.map((c) => (
          <Link
            key={c}
            href={`/san-pham?category=${encodeURIComponent(c)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              category === c ? "bg-primary text-cream" : "bg-warm-beige text-ink hover:bg-peach"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center text-muted">Chưa có sản phẩm nào trong danh mục này.</div>
      )}
    </div>
  );
}
