export default function Footer() {
  return (
    <footer className="mt-auto bg-footer text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="text-lg font-bold">Trà &amp; Bánh</div>
          <p className="mt-2 text-sm text-cream/70">
            Nguyên liệu trà, bánh, pha chế — bán sỉ &amp; lẻ.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-cream/80">Liên hệ nhanh</div>
          <p className="mt-2 text-sm text-cream/70">Zalo/Hotline: 0906.363.395</p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-cream/80">Thông tin</div>
          <p className="mt-2 text-sm text-cream/70">Chính sách đổi trả · Hỗ trợ</p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} Trà &amp; Bánh. Đang xây dựng.
      </div>
    </footer>
  );
}
