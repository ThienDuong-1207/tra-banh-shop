"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";

// "Cài đặt cửa hàng" — đọc/ghi trực tiếp bảng shop_settings (singleton 1
// dòng, id luôn = true — xem supabase/migrations/003_shop_settings.sql).
// Storefront (Footer) đọc bảng này qua lib/shopSettings.ts — sửa ở đây có
// hiệu lực ngay trên web, không cần deploy lại code.
export default function ShopSettingsView({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [gpkdNumber, setGpkdNumber] = useState("");
  const [addresses, setAddresses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("shop_settings").select("gpkd_number, addresses").eq("id", true).maybeSingle();
      if (!cancelled) {
        if (!error && data) {
          setGpkdNumber(data.gpkd_number ?? "");
          setAddresses(data.addresses?.length ? data.addresses : [""]);
        } else {
          setAddresses([""]);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    const cleanAddresses = addresses.map((a) => a.trim()).filter(Boolean);
    const { error } = await supabase
      .from("shop_settings")
      .update({ gpkd_number: gpkdNumber.trim(), addresses: cleanAddresses, updated_at: new Date().toISOString(), updated_by: userId })
      .eq("id", true);
    setSaving(false);
    if (error) {
      setError("Lưu thất bại: " + error.message);
      return;
    }
    setSavedAt(new Date());
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-state">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="view-header">
        <div>
          <h1>Cài đặt cửa hàng</h1>
          <p>Hiển thị ở chân trang website — điền khi có thông tin thật, không cần sửa code.</p>
        </div>
      </div>

      <div className="field-group" style={{ maxWidth: 520 }}>
        <label className="field">
          Số giấy phép kinh doanh (GPKD)
          <input value={gpkdNumber} onChange={(e) => setGpkdNumber(e.target.value)} placeholder="Chưa có — để trống sẽ không hiện ở footer" />
        </label>
      </div>

      <div className="field-group" style={{ maxWidth: 520 }}>
        <h3>Địa chỉ cửa hàng</h3>
        {addresses.map((addr, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              style={{ flex: 1 }}
              value={addr}
              onChange={(e) => setAddresses((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            />
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setAddresses((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : [""]))}
            >
              Xoá
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-neutral" onClick={() => setAddresses((prev) => [...prev, ""])}>
          + Thêm địa chỉ
        </button>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="modal-actions" style={{ justifyContent: "flex-start", borderTop: "none", paddingTop: 0 }}>
        <button className="btn btn-primary" type="button" disabled={saving} onClick={save}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        {savedAt && <span className="helper-text" style={{ marginTop: 0 }}>Đã lưu lúc {savedAt.toLocaleTimeString("vi-VN")}</span>}
      </div>
    </div>
  );
}
