import Image from "next/image";
import Link from "next/link";
import CartBadge from "@/components/CartBadge";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-primary text-cream">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/logo.png" alt="Trà & Bánh" width={124} height={40} className="rounded-lg" priority />
        </Link>
        <div className="flex-1" />
        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href="/" className="hover:text-accent">
            Trang chủ
          </Link>
          <Link href="/san-pham" className="hover:text-accent">
            Sản phẩm
          </Link>
          <Link href="/lien-he" className="hover:text-accent">
            Liên hệ
          </Link>
        </nav>
        <CartBadge />
      </div>
    </header>
  );
}
