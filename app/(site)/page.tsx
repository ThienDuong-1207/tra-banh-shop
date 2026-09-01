import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { CATEGORY_ORDER, categorySlug } from "@/lib/categories";
import { getCategoryImage } from "@/lib/categoryImages";
import { MONIN_ALT, MONIN_FRAMED } from "@/lib/productImages";
import { NEWS_ITEMS } from "@/lib/news";
import ProductCard from "@/components/ProductCard";
import WeeklyBestSelling from "@/components/WeeklyBestSelling";
import ContactBanner from "@/components/ContactBanner";
import { ArrowRightIcon, ShieldCheckIcon, TruckIcon, ChatIcon, NewsIcon, BoltIcon } from "@/components/icons";

export const revalidate = 60;

const QUICK_CATEGORIES = CATEGORY_ORDER.slice(0, 5);

// Viền màu xen kẽ quanh ảnh mỗi thẻ danh mục — tái dùng đúng token màu đã có
// (promo-a/b/c/d, accent vàng gold), không thêm màu mới, chỉ để dải danh mục
// "tươi" hơn thay vì toàn bộ card trắng đơn sắc. Đổi 1 slot từ cta (lime,
// vốn đã lặp lại ở nút "Xem tất cả" ngay cạnh) sang accent — vàng gold gần
// như chưa xuất hiện ở đâu khác trên trang, nên đưa vào đây giúp bảng màu đỡ
// phẳng mà không đụng vai trò CTA hành động của lime.
const TILE_ACCENTS = ["ring-promo-a", "ring-promo-b", "ring-promo-c", "ring-promo-d", "ring-accent"];

// Khối tiêu chí tin cậy — thay cho pattern "Featured store" (site 1 nhà cung
// cấp, không phải marketplace nhiều vendor nên không áp dụng được). Nội dung
// đã xác nhận với chủ shop, tái dùng token màu promo-a/b/c có sẵn.
const TRUST_ITEMS = [
  {
    title: "Hàng chính hãng",
    desc: "Nhập trực tiếp từ thương hiệu/nhà phân phối, không qua trung gian trôi nổi.",
    color: "bg-promo-a",
    Icon: ShieldCheckIcon,
  },
  {
    title: "Giao hàng tận nơi",
    desc: "Giao đến tận quán/kho, nhận hàng kiểm tra trước khi thanh toán.",
    color: "bg-promo-b",
    Icon: TruckIcon,
  },
  {
    title: "Tư vấn miễn phí",
    desc: "Nhắn Zalo để được tư vấn công thức, định lượng nguyên liệu phù hợp.",
    color: "bg-promo-c",
    Icon: ChatIcon,
  },
];

export default async function Home() {
  const products = await getAllProducts();
  const byCategory = new Map<string, number>();
  for (const p of products) byCategory.set(p.category_sheet, (byCategory.get(p.category_sheet) ?? 0) + 1);
  const presentCategories = CATEGORY_ORDER.filter((c) => (byCategory.get(c) ?? 0) > 0);

  return (
    <div>
      {/* Hero — khối bo góc lớn nền đỏ đô, mép dưới lượn sóng, tiêu đề 2 dòng +
          CTA pill + ảnh sản phẩm bên phải (theo bố cục video Gromuse). */}
      <section className="mx-auto max-w-[var(--container-shop)] px-4 pt-8 sm:pt-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary">
          <div className="grid gap-8 px-6 pb-14 pt-9 sm:px-10 sm:pb-16 sm:pt-12 lg:grid-cols-2 lg:items-center lg:gap-6">
            <div className="flex flex-col gap-5 text-cream">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                Nguyên liệu pha chế
                <br />
                chuẩn quán, đặt lại trong 1 phút
              </h1>
              <p className="max-w-md text-cream/80">
                Syrup, sữa, bột, trân châu… giá sỉ theo thùng và giá lẻ hiển thị rõ ngay từ đầu — không cần
                gọi hỏi mới biết giá.
              </p>
              <Link
                href="/san-pham"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-cta px-7 py-3 font-semibold text-ink transition hover:bg-cta-hover"
              >
                Xem sản phẩm
              </Link>
            </div>

            <div className="relative mx-auto h-48 w-48 sm:h-64 sm:w-64 lg:h-72 lg:w-72">
              {/* Quầng sáng vàng gold sau ảnh sản phẩm — điểm nhấn "sang trọng"
                  duy nhất trên hero, không lặp lại nơi khác trên trang. Vượt
                  ra ngoài khung ảnh (âm inset) vì ảnh MONIN_FRAMED có nền
                  trắng đục phủ kín khung, quầng sáng cần lộ ra rìa mới thấy
                  được trên nền đỏ đô. Không dùng -z-10: parent chỉ có
                  position:relative (chưa tạo stacking context riêng), z-index
                  âm sẽ thoát ra ngoài và bị đè bởi bg-primary của cả khối
                  hero — không set z-index, thứ tự DOM (khai báo trước ảnh) là
                  đủ để nằm dưới ảnh. */}
              <div className="absolute -inset-6 rounded-full bg-accent/50 blur-3xl sm:-inset-10" aria-hidden="true" />
              <Image
                src={MONIN_FRAMED}
                alt={MONIN_ALT}
                fill
                priority
                sizes="(min-width: 1024px) 25vw, 45vw"
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Mép dưới lượn sóng — SVG phủ màu nền trang lên đáy khối primary,
              dễ bảo trì hơn clip-path vì chỉnh path là chỉnh được ngay hình
              dạng sóng mà không ảnh hưởng layout nội dung bên trên. */}
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-12 w-full text-surface sm:h-16"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M0,64 C240,110 480,20 720,48 C960,76 1200,24 1440,58 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </section>

      {/* Danh mục nhanh — 5 thẻ trắng + 1 ô "Xem tất cả". */}
      <section className="mx-auto max-w-[var(--container-shop)] px-4 py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {QUICK_CATEGORIES.map((c, i) => {
            const image = getCategoryImage(c);
            const count = byCategory.get(c) ?? 0;
            return (
              <Link
                key={c}
                href={`/san-pham?category=${categorySlug(c)}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-ink">{c}</span>
                  <span className="text-xs text-muted">{count} sản phẩm</span>
                </div>
                <div
                  className={`relative ml-auto h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-alt ring-2 ${TILE_ACCENTS[i % TILE_ACCENTS.length]}`}
                >
                  {image && (
                    <Image src={image.url} alt="" fill sizes="44px" className="object-cover" />
                  )}
                </div>
              </Link>
            );
          })}
          <Link
            href="/san-pham"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-cta p-3 text-center text-ink transition hover:bg-cta-hover"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70">
              <ArrowRightIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Xem tất cả</span>
          </Link>
        </div>
      </section>

      {/* 3. Flash Sale — chỉ đổi tên/nhãn từ "Sản phẩm bán chạy", KHÔNG thêm
          giá gạch ngang/countdown giả vì chưa có dữ liệu giá khuyến mãi hay
          thời gian kết thúc thật. Dữ liệu/logic bên dưới giữ nguyên. */}
      {products.length > 0 ? (
        <section className="mx-auto max-w-[var(--container-shop)] px-4 pb-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-ink">
              <BoltIcon className="h-6 w-6 text-accent-hover" />
              Flash Sale
            </h2>
            <Link href="/san-pham" className="text-sm font-semibold text-primary hover:underline">
              Xem thêm →
            </Link>
          </div>
          <WeeklyBestSelling products={products} categories={presentCategories} />
        </section>
      ) : (
        <section className="mx-auto max-w-[var(--container-shop)] px-4 pb-16 text-center text-muted">
          Chưa có sản phẩm nào hiển thị — cần chạy migration
          <code className="mx-1 rounded bg-surface-alt px-1.5 py-0.5">001_orders_and_public_products.sql</code>
          trong Supabase SQL Editor trước.
        </section>
      )}

      {/* 4. Tiêu chí tin cậy — thay pattern "Featured store" (không áp dụng vì
          đây là site 1 nhà cung cấp, không phải marketplace nhiều vendor). */}
      <section className="mx-auto max-w-[var(--container-shop)] px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">Vì sao chọn Trà &amp; Bánh</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TRUST_ITEMS.map(({ title, desc, color, Icon }) => (
            <div key={title} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
              <div className={`flex h-24 items-center px-5 text-cream ${color}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Sản phẩm theo từng loại — mỗi danh mục có sản phẩm 1 hàng riêng. */}
      {presentCategories.map((category) => {
        const items = products.filter((p) => p.category_sheet === category).slice(0, 5);
        if (items.length === 0) return null;
        return (
          <section key={category} className="mx-auto max-w-[var(--container-shop)] px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-ink">{category}</h2>
              <Link
                href={`/san-pham?category=${categorySlug(category)}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Xem thêm →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );
      })}

      {/* 6. Tin tức & Mẹo pha chế — khung nội dung, chưa có bài viết/CMS thật
          (xem lib/news.ts). Không có link vì chưa có trang bài viết riêng. */}
      <section className="mx-auto max-w-[var(--container-shop)] px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <NewsIcon className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-ink">Tin tức &amp; Mẹo pha chế</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {NEWS_ITEMS.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <h3 className="font-bold leading-snug text-ink">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.excerpt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Liên hệ. */}
      <section className="mx-auto max-w-[var(--container-shop)] px-4 py-10">
        <ContactBanner
          title="Cần tư vấn trước khi đặt số lượng lớn?"
          desc="Nhắn Zalo cho shop để được báo giá sỉ, kiểm tra tồn kho và tư vấn công thức pha chế — phản hồi trong giờ làm việc."
        />
      </section>
    </div>
  );
}
