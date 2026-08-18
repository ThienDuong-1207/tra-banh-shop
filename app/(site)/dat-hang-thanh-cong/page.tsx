import Link from "next/link";
import { redirect } from "next/navigation";
import { buildVietQrUrl, getBankInfo } from "@/lib/bank";
import { formatVnd } from "@/lib/products";
import { CheckCircleIcon } from "@/components/icons";
import ClearCartOnMount from "@/components/ClearCartOnMount";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string; tong?: string }>;
}) {
  const { ma, tong } = await searchParams;
  const totalAmount = Number(tong);
  if (!ma || !Number.isFinite(totalAmount)) {
    redirect("/");
  }

  const bank = getBankInfo();
  const qrUrl = bank ? buildVietQrUrl(bank, totalAmount, ma) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <ClearCartOnMount />

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cta-soft">
          <CheckCircleIcon className="h-11 w-11 text-cta-hover" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink sm:text-3xl">Đặt hàng thành công!</h1>
        <p className="mt-2 text-muted">
          Shop đã nhận đơn <span className="font-semibold text-ink">{ma}</span> — liên hệ Zalo/Hotline{" "}
          <span className="font-semibold text-ink">0906.363.395</span> nếu cần hỗ trợ thêm.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-surface-alt p-6">
        <div className="flex items-center justify-center gap-2 text-sm text-muted">Mã đơn hàng</div>
        <div className="mt-1 text-xl font-bold tracking-wide text-primary">{ma}</div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">Tổng thanh toán</div>
        <div className="mt-1 text-2xl font-bold text-ink">{formatVnd(totalAmount)}</div>
      </div>

      {qrUrl ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-semibold text-ink">Quét mã để chuyển khoản</h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh QR sinh động theo số tiền/nội dung, không cần tối ưu next/image */}
          <img
            src={qrUrl}
            alt={`Mã QR chuyển khoản đơn hàng ${ma}, số tiền ${formatVnd(totalAmount)}`}
            width={260}
            height={260}
            className="h-auto w-64 rounded-xl"
          />
          <p className="text-sm text-muted">
            Nội dung chuyển khoản đã tự điền sẵn: <span className="font-semibold text-ink">{ma}</span>
          </p>
          <p className="text-xs text-muted">
            Đơn sẽ được xác nhận thủ công sau khi shop nhận được chuyển khoản.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-white p-6 text-sm text-muted shadow-sm ring-1 ring-black/5">
          Vui lòng nhắn Zalo/Hotline <span className="font-semibold text-ink">0906.363.395</span> kèm mã đơn{" "}
          <span className="font-semibold text-ink">{ma}</span> để được hướng dẫn chuyển khoản.
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-black/10 p-6 text-left">
        <h2 className="text-center font-semibold text-ink">Bước tiếp theo</h2>
        <ol className="mt-4 flex flex-col gap-3 text-sm text-ink">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-cream">
              1
            </span>
            <span>Shop xác nhận đơn ngay sau khi nhận được chuyển khoản đúng nội dung.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-cream">
              2
            </span>
            <span>Đơn được đóng gói và giao trong thời gian sớm nhất, tuỳ khu vực và số lượng đặt.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-cream">
              3
            </span>
            <span>Bạn nhận hàng và kiểm tra trước khi thanh toán phần còn lại (nếu có thoả thuận riêng).</span>
          </li>
        </ol>
        <p className="mt-4 border-t border-black/10 pt-4 text-sm text-muted">
          Cần đổi/huỷ đơn hoặc có thắc mắc? Nhắn Zalo{" "}
          <a
            href={`https://zalo.me/0906363395?text=${encodeURIComponent(`Chào shop, tôi muốn hỏi về đơn ${ma}`)}`}
            className="font-semibold text-primary underline hover:text-primary-dark"
          >
            0906.363.395
          </a>{" "}
          kèm mã đơn <span className="font-semibold text-ink">{ma}</span>.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/san-pham"
          className="inline-flex items-center justify-center rounded-full bg-cta px-8 py-3 font-semibold text-ink transition hover:bg-cta-hover"
        >
          Đặt thêm sản phẩm
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-black/10 px-8 py-3 font-semibold text-ink transition hover:bg-surface-alt"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
