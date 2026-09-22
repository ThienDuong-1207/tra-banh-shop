"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import type { Coupon } from "@/lib/admin/types";

type FormState = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  min_order_amount: string;
  usage_limit: string;
  starts_at: string;
  expires_at: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order_amount: "0",
  usage_limit: "",
  starts_at: "",
  expires_at: "",
  active: true,
};

function couponToForm(c: Coupon): FormState {
  return {
    code: c.code,
    discount_type: c.discount_type,
    discount_value: String(c.discount_value),
    min_order_amount: String(c.min_order_amount),
    usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
    starts_at: c.starts_at ? c.starts_at.slice(0, 10) : "",
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
    active: c.active,
  };
}

// "Mã khuyến mãi" — CRUD trực tiếp bảng coupons (RLS đã cấp cho nhân sự nội
// bộ ở supabase/migrations/005_coupons.sql). Đây là mã THẬT — checkout ở
// storefront validate lại đúng bảng này (lib/coupons.ts:validateCoupon),
// không phải UI giả như trước.
export default function CouponsView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (!error) setCoupons((data as Coupon[]) ?? []);
    setLoading(false);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setEditing("new");
  }

  function openEdit(c: Coupon) {
    setForm(couponToForm(c));
    setError(null);
    setEditing(c);
  }

  async function save() {
    const code = form.code.trim().toUpperCase();
    const discount_value = Number(form.discount_value);
    if (!code) {
      setError("Nhập mã.");
      return;
    }
    if (!discount_value || discount_value <= 0) {
      setError("Giá trị giảm phải lớn hơn 0.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      code,
      discount_type: form.discount_type,
      discount_value,
      min_order_amount: Number(form.min_order_amount) || 0,
      usage_limit: form.usage_limit.trim() ? Number(form.usage_limit) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
    };
    const { error } =
      editing === "new"
        ? await supabase.from("coupons").insert(payload)
        : await supabase.from("coupons").update(payload).eq("id", (editing as Coupon).id);
    setSaving(false);
    if (error) {
      setError(error.code === "23505" ? "Mã này đã tồn tại." : "Lưu thất bại: " + error.message);
      return;
    }
    setEditing(null);
    load();
  }

  async function toggleActive(c: Coupon) {
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    load();
  }

  async function remove(c: Coupon) {
    if (!confirm(`Xoá mã "${c.code}"? Đơn hàng đã dùng mã này vẫn giữ nguyên lịch sử, không bị ảnh hưởng.`)) return;
    await supabase.from("coupons").delete().eq("id", c.id);
    load();
  }

  const now = new Date();
  function statusOf(c: Coupon): { label: string; cls: string } {
    if (!c.active) return { label: "Đã tắt", cls: "pill-danger" };
    if (c.expires_at && now > new Date(c.expires_at)) return { label: "Hết hạn", cls: "pill-danger" };
    if (c.usage_limit != null && c.used_count >= c.usage_limit) return { label: "Hết lượt", cls: "pill-warm" };
    if (c.starts_at && now < new Date(c.starts_at)) return { label: "Chưa tới ngày", cls: "pill-warm" };
    return { label: "Đang chạy", cls: "pill-success" };
  }

  const discountLabel = useMemo(
    () => (c: Coupon) => (c.discount_type === "percent" ? `${c.discount_value}%` : `${formatVnd(c.discount_value)}đ`),
    []
  );

  return (
    <div className="app table-page">
      <div className="view-header">
        <div>
          <h1>Mã khuyến mãi</h1>
          <p>Mã thật — checkout ở website kiểm tra trực tiếp danh sách này.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Tạo mã mới
        </button>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Giảm giá</th>
                <th className="num">Đơn tối thiểu</th>
                <th className="num">Đã dùng</th>
                <th>Thời hạn</th>
                <th className="col-status">Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Chưa có mã khuyến mãi nào.
                  </td>
                </tr>
              )}
              {coupons.map((c) => {
                const status = statusOf(c);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 650 }}>{c.code}</td>
                    <td>{discountLabel(c)}</td>
                    <td className="num">{c.min_order_amount > 0 ? `${formatVnd(c.min_order_amount)}đ` : "—"}</td>
                    <td className="num">
                      {c.used_count}
                      {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                    </td>
                    <td>
                      {c.starts_at ? formatDate(c.starts_at) : "—"} → {c.expires_at ? formatDate(c.expires_at) : "Không hết hạn"}
                    </td>
                    <td className="col-status">
                      <span className={`pill ${status.cls}`}>
                        <span className="dot" />
                        {status.label}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-quiet" onClick={() => openEdit(c)}>
                        Sửa
                      </button>
                      <button className="btn btn-quiet" onClick={() => toggleActive(c)}>
                        {c.active ? "Tắt" : "Bật"}
                      </button>
                      <button className="btn btn-quiet" onClick={() => remove(c)}>
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal">
            <h2>{editing === "new" ? "Tạo mã khuyến mãi" : `Sửa mã ${(editing as Coupon).code}`}</h2>

            <div className="field-grid">
              <label className="field">
                Mã (viết hoa)
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="VD: GIAM10" />
              </label>
              <label className="field">
                Loại giảm giá
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percent" | "fixed" }))}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (đ)</option>
                </select>
              </label>
              <label className="field">
                Giá trị giảm
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === "percent" ? "VD: 10" : "VD: 50000"}
                />
              </label>
              <label className="field">
                Đơn tối thiểu (đ, để 0 nếu không giới hạn)
                <input
                  type="number"
                  value={form.min_order_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                />
              </label>
              <label className="field">
                Giới hạn lượt dùng (để trống nếu không giới hạn)
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                />
              </label>
              <label className="field">
                Bắt đầu (để trống nếu áp dụng ngay)
                <input type="date" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
              </label>
              <label className="field">
                Hết hạn (để trống nếu không hết hạn)
                <input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
              </label>
              <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Đang bật
              </label>
            </div>

            {error && <p className="login-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn" type="button" onClick={() => setEditing(null)}>
                Huỷ
              </button>
              <button className="btn btn-primary" type="button" disabled={saving} onClick={save}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
