import Image from "next/image";
import { MONIN_ALT, MONIN_FRAMED } from "@/lib/productImages";

// Banner liên hệ 2 cột (nền tối + ảnh sản phẩm bên phải) — dùng ở trang chủ
// (section "Liên hệ") và cuối trang chi tiết sản phẩm, chỉ khác tiêu đề/mô
// tả. Không có app di động thật nên không dùng badge Google Play/App Store
// như layout tham khảo — thay bằng CTA Zalo/hotline đã có sẵn của shop.
export default function ContactBanner({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="grid items-center gap-6 overflow-hidden rounded-[2rem] bg-primary-dark px-6 py-10 text-cream sm:px-10 lg:grid-cols-2">
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-md text-cream/80">{desc}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="https://zalo.me/0906363395"
            className="inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3 font-semibold text-ink transition hover:bg-cta-hover"
          >
            Chat Zalo ngay
          </a>
          <a
            href="tel:0906363395"
            className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 font-semibold text-cream transition hover:bg-primary"
          >
            Gọi 0906.363.395
          </a>
        </div>
      </div>
      <div className="relative mx-auto h-44 w-44 sm:h-56 sm:w-56">
        <Image src={MONIN_FRAMED} alt={MONIN_ALT} fill sizes="224px" className="object-contain" />
      </div>
    </div>
  );
}
