import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { CATEGORY_ORDER, categorySlug } from "@/lib/categories";
import { HERO_IMAGE, getCategoryImage } from "@/lib/categoryImages";
import ProductCard from "@/components/ProductCard";
import { SearchIcon } from "@/components/icons";

export const revalidate = 60;

export default async function Home() {
  const products = await getAllProducts();
  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.category_sheet, (byCategory.get(p.category_sheet) ?? 0) + 1);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:pt-10">
        <div className="grid overflow-hidden rounded-3xl bg-primary lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 px-6 py-10 text-cream sm:px-10 sm:py-14">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Nguyên liệu pha chế cho quán trà &amp; bánh
            </h1>
            <p className="max-w-md text-cream/80">
              Đặt lại nhanh nguyên liệu quen thuộc, hoặc tìm mặt hàng mới — giá sỉ theo thùng &amp; giá lẻ
              rõ ràng ngay từ đầu.
            </p>

            <form action="/san-pham" className="flex max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-lg">
              <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
              <label htmlFor="hero-search" className="sr-only">
                Tìm sản phẩm
              </label>
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder="Tìm syrup, sữa, trân châu…"
                className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-hover"
              >
                Tìm
              </button>
            </form>

            <Link href="/san-pham" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              Xem tất cả sản phẩm →
            </Link>
          </div>

          <div className="relative min-h-[220px] lg:min-h-0">
            <Image
              src={HERO_IMAGE.url}
              alt={HERO_IMAGE.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-ink">Danh mục</h2>
        <p className="mt-1 text-sm text-muted">Chọn danh mục để xem nhanh các mặt hàng đang có.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_ORDER.map((c, i) => {
            const image = getCategoryImage(c);
            const count = byCategory.get(c) ?? 0;
            const isAboveFold = i < 5;
            return (
              <Link
                key={c}
                href={`/san-pham?category=${categorySlug(c)}`}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {image ? (
                  <>
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                      priority={isAboveFold}
                      loading={isAboveFold ? undefined : "lazy"}
                      className="object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-footer" />
                )}
                <div className="relative flex flex-col gap-0.5 p-4 text-cream">
                  <span className="font-semibold">{c}</span>
                  <span className="text-xs text-cream/75">{count} sản phẩm</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {products.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">Sản phẩm đang có hàng</h2>
            <Link href="/san-pham" className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            {products.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 pb-16 text-center text-muted">
          Chưa có sản phẩm nào hiển thị — cần chạy migration
          <code className="mx-1 rounded bg-surface-alt px-1.5 py-0.5">001_orders_and_public_products.sql</code>
          trong Supabase SQL Editor trước.
        </section>
      )}
    </div>
  );
}
