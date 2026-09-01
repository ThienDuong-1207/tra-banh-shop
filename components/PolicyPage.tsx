import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

// Khung dùng chung cho 4 trang chính sách (đổi trả/giao hàng/thanh toán/bảo
// mật) — cùng 1 bố cục breadcrumb + tiêu đề + nội dung, tránh lặp code.
export default function PolicyPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-primary">
          Trà &amp; Bánh
        </Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-ink">{title}</span>
      </nav>
      <h1 className="mt-4 text-2xl font-bold text-ink">{title}</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-ink [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted [&_li]:mt-1">
        {children}
      </div>
      <p className="mt-8 rounded-2xl bg-surface-alt p-4 text-sm text-muted">
        Còn thắc mắc? Nhắn Zalo/Hotline{" "}
        <a href="https://zalo.me/0906363395" className="font-semibold text-primary hover:underline">
          0906.363.395
        </a>{" "}
        để được hỗ trợ trực tiếp.
      </p>
    </div>
  );
}
