export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="rounded-3xl bg-primary px-8 py-16 text-center text-cream sm:px-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Nguyên liệu trà · bánh · pha chế
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Trà &amp; Bánh</h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/80">
          Website đang được xây dựng — sắp ra mắt danh mục sản phẩm, giá sỉ/lẻ và đặt hàng trực
          tuyến.
        </p>
        <a
          href="https://zalo.me/0906363395"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-semibold text-ink hover:bg-accent-hover"
        >
          Liên hệ qua Zalo
        </a>
      </section>
    </div>
  );
}
