import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getProductsByCategory } from "@/lib/products";
import { getCategoryImage } from "@/lib/categoryImages";
import { MONIN_ALT, MONIN_FRAMED, MONIN_PLAIN } from "@/lib/productImages";
import { categorySlug } from "@/lib/categories";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductCard from "@/components/ProductCard";
import ContactBanner from "@/components/ContactBanner";
import { ArrowLeftIcon, ChevronRightIcon, ShieldCheckIcon, TruckIcon, ChatIcon } from "@/components/icons";

// Dải tin cậy dưới nút mua — cùng 3 tiêu chí đã dùng ở section "Vì sao chọn
// Trà & Bánh" trên trang chủ, thu gọn thành hàng ngang. Thay cho badge giảm
// giá/countdown/sao đánh giá giả của layout tham khảo — nội dung đã xác
// nhận là thật, không bịa số liệu bán hàng/đánh giá không có thật.
const TRUST_BADGES = [
  { label: "Hàng chính hãng", Icon: ShieldCheckIcon },
  { label: "Giao hàng tận nơi", Icon: TruckIcon },
  { label: "Tư vấn miễn phí", Icon: ChatIcon },
];

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const categoryImage = getCategoryImage(product.category_sheet);
  const isMonin = (product.brand_name ?? "").toLowerCase().includes("monin");
  // Ảnh chính: nếu đúng là sản phẩm Monin mẫu, dùng ảnh thật của chính nó +
  // 2 thumbnail biến thể thật (không phải nhiều ảnh giả cho mọi sản phẩm) —
  // các sản phẩm khác chỉ có 1 ảnh chất liệu đại diện theo danh mục, không
  // bịa thêm góc chụp không có thật.
  const mainImage = isMonin ? { url: MONIN_PLAIN, alt: MONIN_ALT } : categoryImage;
  const thumbnails = isMonin
    ? [
        { url: MONIN_PLAIN, alt: MONIN_ALT },
        { url: MONIN_FRAMED, alt: `${MONIN_ALT} — khung trang trí` },
      ]
    : [];

  const zaloMessage = encodeURIComponent(`Chào shop, tôi muốn hỏi về: ${product.ten_hang_hoa}`);

  const sameCategory = await getProductsByCategory(product.category_sheet);
  const related = sameCategory.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28 lg:pb-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-primary">
          Trà &amp; Bánh
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <Link href={`/san-pham?category=${categorySlug(product.category_sheet)}`} className="hover:text-primary">
          {product.category_sheet}
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="line-clamp-1 font-medium text-ink">{product.ten_hang_hoa}</span>
      </nav>
      <Link href="/san-pham" className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <div
            className={`relative overflow-hidden rounded-3xl bg-surface-alt ring-1 ring-black/5 ${
              isMonin ? "aspect-[3/4]" : "aspect-square"
            }`}
          >
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={isMonin ? "object-contain p-4" : "object-cover"}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-lg font-semibold text-ink/50">
                {product.category_sheet}
              </div>
            )}
          </div>
          {thumbnails.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {[mainImage, ...thumbnails].slice(0, 4).map((t, i) => (
                <div
                  key={i}
                  className={`relative aspect-square overflow-hidden rounded-xl bg-surface-alt ring-2 ${
                    i === 0 ? "ring-primary" : "ring-transparent"
                  }`}
                >
                  {t && <Image src={t.url} alt={t.alt} fill sizes="120px" className="object-contain p-2" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="flex flex-col">
            {product.brand_name && <span className="text-sm text-muted">{product.brand_name}</span>}
            <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{product.ten_hang_hoa}</h1>
          </div>

          <ProductPurchasePanel product={product} />

          <a
            href={`https://zalo.me/0906363395?text=${zaloMessage}`}
            className="text-center text-sm font-medium text-muted underline hover:text-primary"
          >
            Cần tư vấn thêm? Nhắn Zalo cho shop
          </a>

          <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl bg-surface-alt px-4 py-3">
            {TRUST_BADGES.map(({ label, Icon }) => (
              <span key={label} className="flex items-center gap-2 text-xs font-medium text-ink">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 border-y border-black/10 py-3 text-sm text-muted">
            <span>
              Mã sản phẩm: <span className="font-medium text-ink">{product.id.slice(0, 8).toUpperCase()}</span>
            </span>
            <span>
              Danh mục:{" "}
              <Link
                href={`/san-pham?category=${categorySlug(product.category_sheet)}`}
                className="font-medium text-primary hover:underline"
              >
                {product.category_sheet}
              </Link>
            </span>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-2xl border border-black/10 p-5 text-sm">
            <div className="contents">
              <dt className="text-muted">Quy cách</dt>
              <dd className="font-medium text-ink">{product.quy_cach ?? "—"}</dd>
            </div>
            <div className="contents">
              <dt className="text-muted">Đơn vị</dt>
              <dd className="font-medium text-ink">{product.dvt ?? "—"}</dd>
            </div>
            <div className="contents">
              <dt className="text-muted">Thương hiệu</dt>
              <dd className="font-medium text-ink">{product.brand_name ?? "—"}</dd>
            </div>
          </dl>

          {product.mo_ta && (
            <div>
              <h2 className="font-semibold text-ink">Mô tả sản phẩm</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{product.mo_ta}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-ink">Sản phẩm cùng danh mục</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <ContactBanner
          title="Thao tác tại nhà, nhận đủ nguyên liệu, an tâm kinh doanh!"
          desc="Đặt hàng online, giao tận quán — không cần rời quán vẫn có đủ nguyên liệu pha chế cho ca bán hôm nay."
        />
      </section>
    </div>
  );
}
