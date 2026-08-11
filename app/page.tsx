import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { CATEGORY_ORDER, categorySlug } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

export default async function Home() {
  const products = await getAllProducts();
  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.category_sheet, (byCategory.get(p.category_sheet) ?? 0) + 1);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="rounded-3xl bg-primary px-8 py-16 text-center text-cream sm:px-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Nguyên liệu trà · bánh · pha chế
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Trà &amp; Bánh</h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">
            Nguyên liệu pha chế giá sỉ &amp; lẻ — đặt hàng trực tuyến, giao tận nơi.
          </p>
          <Link
            href="/san-pham"
            className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-semibold text-ink hover:bg-accent-hover"
          >
            Xem sản phẩm
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-ink">Danh mục sản phẩm</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {CATEGORY_ORDER.map((c) => (
            <Link
              key={c}
              href={`/san-pham?category=${categorySlug(c)}`}
              className="flex flex-col items-center gap-2 rounded-2xl bg-warm-beige px-4 py-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-semibold text-ink">{c}</span>
              <span className="text-xs text-muted">{byCategory.get(c) ?? 0} sản phẩm</span>
            </Link>
          ))}
        </div>
      </section>

      {products.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">Sản phẩm nổi bật</h2>
            <Link href="/san-pham" className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-12 text-center text-muted">
          Chưa có sản phẩm nào hiển thị — cần chạy migration
          <code className="mx-1 rounded bg-warm-beige px-1.5 py-0.5">001_orders_and_public_products.sql</code>
          trong Supabase SQL Editor trước.
        </section>
      )}
    </div>
  );
}
