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
      <CheckCircleIcon className="mx-auto h-14 w-14 text-primary" />
      <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">Đặt hàng thành công!</h1>
      <p className="mt-2 text-muted">Cảm ơn bạn đã đặt hàng — hãy lưu lại mã đơn bên dưới.</p>

      <div className="mt-8 rounded-2xl bg-warm-beige p-6">
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

      <Link
        href="/san-pham"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 font-semibold text-ink hover:bg-accent-hover"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  );
}
