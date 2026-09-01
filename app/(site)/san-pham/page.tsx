import { Suspense } from "react";
import Link from "next/link";
import { getAllProducts, getProductsByCategory } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import FilterSortBar from "@/components/FilterSortBar";
import { ChevronRightIcon } from "@/components/icons";

export const revalidate = 60;

type SearchParams = {
  category?: string;
  don_vi?: "le" | "thung";
  gia_tu?: string;
  gia_den?: string;
  sort?: "gia-tang" | "gia-giam" | "ten-az";
  q?: string;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { category, don_vi, gia_tu, gia_den, sort, q } = await searchParams;
  let products = category ? await getProductsByCategory(category) : await getAllProducts();

  if (q) {
    const needle = q.trim().toLowerCase();
    if (needle) {
      products = products.filter(
        (p) =>
          p.ten_hang_hoa.toLowerCase().includes(needle) ||
          (p.brand_name?.toLowerCase().includes(needle) ?? false)
      );
    }
  }

  if (don_vi === "thung") {
    products = products.filter((p) => p.gia_thung != null);
  } else if (don_vi === "le") {
    products = products.filter((p) => p.gia_ban != null);
  }

  const minGia = gia_tu ? Number(gia_tu) : null;
  const maxGia = gia_den ? Number(gia_den) : null;
  if (minGia != null && Number.isFinite(minGia)) {
    products = products.filter((p) => (p.gia_ban ?? 0) >= minGia);
  }
  if (maxGia != null && Number.isFinite(maxGia)) {
    products = products.filter((p) => (p.gia_ban ?? 0) <= maxGia);
  }

  const sorted = [...products];
  if (sort === "gia-tang") {
    sorted.sort((a, b) => (a.gia_ban ?? 0) - (b.gia_ban ?? 0));
  } else if (sort === "gia-giam") {
    sorted.sort((a, b) => (b.gia_ban ?? 0) - (a.gia_ban ?? 0));
  } else if (sort === "ten-az") {
    sorted.sort((a, b) => a.ten_hang_hoa.localeCompare(b.ten_hang_hoa, "vi"));
  }

  return (
    <div>
      <div className="mx-auto max-w-[var(--container-shop)] px-4 sm:px-6 lg:px-10 pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-primary">
            Trà &amp; Bánh
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <span className="font-medium text-ink">{category || "Tất cả danh mục"}</span>
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-ink">Sản phẩm</h1>
        <p className="mt-1 text-sm text-muted">
          {sorted.length} sản phẩm{category ? ` trong ${category}` : ""}
          {q ? ` khớp với "${q}"` : ""}
        </p>
      </div>

      <Suspense
        fallback={<div className="mx-auto mt-6 h-[62px] max-w-[var(--container-shop)] border-b border-black/10 px-4 sm:px-6 lg:px-10" />}
      >
        <FilterSortBar />
      </Suspense>

      <div className="mx-auto max-w-[var(--container-shop)] px-4 sm:px-6 lg:px-10 pb-16">
        {sorted.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {sorted.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 5} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center text-muted">
            Không tìm thấy sản phẩm phù hợp bộ lọc hiện tại.
          </div>
        )}
      </div>
    </div>
  );
}
