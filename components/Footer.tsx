import Link from "next/link";
import { SHOP_GPKD_NUMBER, SHOP_ADDRESSES } from "@/lib/shopInfo";

const POLICY_LINKS = [
  { href: "/chinh-sach-doi-tra", label: "Chính sách đổi trả" },
  { href: "/chinh-sach-giao-hang", label: "Giao nhận & kiểm tra hàng" },
  { href: "/chinh-sach-thanh-toan", label: "Chính sách thanh toán" },
  { href: "/chinh-sach-bao-mat", label: "Chính sách bảo mật" },
];

export default function Footer() {
  return (
    <footer className="mt-auto rounded-t-[2rem] bg-footer text-cream">
      <div className="mx-auto grid max-w-[var(--container-shop)] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
        <div>
          <div className="text-lg font-bold">Trà &amp; Bánh</div>
          <p className="mt-2 text-sm text-cream/70">
            Nguyên liệu trà, bánh, pha chế — bán sỉ &amp; lẻ.
          </p>
          {SHOP_GPKD_NUMBER && (
            <p className="mt-3 text-xs text-cream/50">GPKD số {SHOP_GPKD_NUMBER}</p>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-cream/80">Liên hệ nhanh</div>
          <a
            href="https://zalo.me/0906363395"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-2 text-sm text-cream/90 transition hover:bg-cream/15"
          >
            Zalo/Hotline: 0906.363.395
          </a>
          {SHOP_ADDRESSES.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-cream/70">
              {SHOP_ADDRESSES.map((addr) => (
                <li key={addr}>{addr}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-cream/80">Chính sách</div>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-cream/70">
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-cream">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-cream/80">Danh mục</div>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-cream/70">
            <li>
              <Link href="/san-pham" className="hover:text-cream">
                Tất cả sản phẩm
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} Trà &amp; Bánh. Nguyên liệu trà, bánh, pha chế — bán sỉ &amp; lẻ.
      </div>
    </footer>
  );
}
