"use client";

import { useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import type { Product } from "@/lib/admin/types";

// "Ảnh sản phẩm" — tải ảnh THẬT riêng từng SKU lên Supabase Storage
// (bucket "product-photos", xem supabase/migrations/004_product_photos.sql)
// và ghi lại products.photo_url. Storefront (ProductCard, trang chi tiết)
// tự ưu tiên ảnh này khi có, fallback ảnh chất liệu chung theo danh mục khi
// chưa có — không xoá cơ chế fallback cũ, chỉ bổ sung khi có ảnh thật.
export default function ProductPhotosView({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (missingOnly && p.photo_url) return false;
      if (!q) return true;
      return p.ten_hang_hoa.toLowerCase().includes(q) || p.ma_noi_bo?.toLowerCase().includes(q);
    });
  }, [products, query, missingOnly]);

  async function handleUpload(product: Product, file: File) {
    setUploadingId(product.id);
    const ext = file.name.split(".").pop() || "jpg";
    // Đặt tên file ngẫu nhiên (crypto.randomUUID, không phải Date.now() —
    // React Compiler chặn gọi hàm impure như Date.now() trong thân
    // component) — tránh trùng cache CDN khi thay ảnh mới cho cùng 1 sản
    // phẩm (URL cũ vẫn còn cache ở trình duyệt khách nếu ghi đè đúng tên
    // file cũ).
    const path = `${product.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-photos").upload(path, file, { upsert: true });
    if (uploadError) {
      alert("Tải ảnh thất bại: " + uploadError.message);
      setUploadingId(null);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from("product-photos").getPublicUrl(path);
    const photoUrl = publicUrlData.publicUrl;
    const { error: updateError } = await supabase.from("products").update({ photo_url: photoUrl }).eq("id", product.id);
    setUploadingId(null);
    if (updateError) {
      alert("Lưu ảnh thất bại: " + updateError.message);
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, photo_url: photoUrl } : p)));
  }

  async function handleRemove(product: Product) {
    if (!product.photo_url) return;
    if (!confirm(`Xoá ảnh của "${product.ten_hang_hoa}"?`)) return;
    const { error } = await supabase.from("products").update({ photo_url: null }).eq("id", product.id);
    if (error) {
      alert("Xoá ảnh thất bại: " + error.message);
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, photo_url: null } : p)));
  }

  const missingCount = products.filter((p) => !p.photo_url).length;

  return (
    <div className="app">
      <div className="view-header">
        <div>
          <h1>Ảnh sản phẩm</h1>
          <p>Tải ảnh thật riêng từng sản phẩm — thay dần ảnh minh hoạ chung theo danh mục trên website.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Tổng sản phẩm</div>
          <div className="value">{products.length}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Chưa có ảnh thật</div>
          <div className="value accent">{missingCount}</div>
        </div>
      </div>

      <div className="view-row">
        <input
          placeholder="Tìm theo tên hoặc mã nội bộ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-body-sm)" }}>
          <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
          Chỉ hiện sản phẩm chưa có ảnh
        </label>
      </div>

      <div className="photo-grid">
        {filtered.map((p) => (
          <div className="photo-card" key={p.id}>
            <div className="photo-thumb">
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt={p.ten_hang_hoa} />
              ) : (
                p.category_sheet
              )}
            </div>
            <div className="photo-card-name">{p.ten_hang_hoa}</div>
            <div className="photo-card-cat">{p.category_sheet}</div>
            <div className="photo-card-actions">
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={(el) => {
                  fileInputs.current[p.id] = el;
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(p, file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="btn btn-neutral"
                disabled={uploadingId === p.id}
                onClick={() => fileInputs.current[p.id]?.click()}
              >
                {uploadingId === p.id ? "Đang tải..." : p.photo_url ? "Đổi ảnh" : "Tải ảnh"}
              </button>
              {p.photo_url && (
                <button type="button" className="btn btn-quiet" onClick={() => handleRemove(p)}>
                  Xoá
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
