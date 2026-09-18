"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@/lib/admin/types";
import Segmented from "@/components/admin/Segmented";

const STATUS_ORDER: OrderStatus[] = ["cho_thanh_toan", "da_thanh_toan", "dang_xu_ly", "dang_giao", "hoan_thanh", "huy"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
  dang_xu_ly: "Đang xử lý",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  huy: "Đã huỷ",
};

// Dùng đúng 4 biến thể pill đã có trong app/(admin)/globals.css — không
// thêm màu mới. dang_xu_ly/dang_giao dùng chung pill-primary vì chỉ có 4
// biến thể sẵn có, không phải thiếu sót.
const STATUS_PILL_CLASS: Record<OrderStatus, string> = {
  cho_thanh_toan: "pill-warm",
  da_thanh_toan: "pill-primary",
  dang_xu_ly: "pill-primary",
  dang_giao: "pill-primary",
  hoan_thanh: "pill-success",
  huy: "pill-danger",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  chuyen_khoan: "Chuyển khoản (VietQR)",
  cod: "Tiền mặt khi nhận hàng (COD)",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`pill ${STATUS_PILL_CLASS[status]}`}>
      <span className="dot" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function OrdersView({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>("cho_thanh_toan");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (!cancelled) {
        if (!error) setOrders((data as Order[]) ?? []);
        setLoading(false);
      }
    })();

    // Realtime: đơn mới từ web public hiện ngay không cần refresh — cùng
    // pattern kênh `postgres_changes` đã dùng cho bảng `notifications`.
    const channel = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setOrders((prev) => [payload.new as Order, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    const c = new Map<OrderStatus, number>();
    for (const o of orders) c.set(o.status, (c.get(o.status) ?? 0) + 1);
    return c;
  }, [orders]);

  // Dải số liệu nhanh — chuẩn e-commerce admin (Shopify-style "today's
  // orders/revenue" ở đầu trang Orders). Doanh thu KHÔNG tính đơn đã huỷ,
  // "hôm nay"/"7 ngày qua" tính theo giờ trình duyệt của người xem.
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    let ordersToday = 0;
    let revenue7Days = 0;
    for (const o of orders) {
      const createdAt = new Date(o.created_at);
      if (createdAt >= startOfToday) ordersToday++;
      if (o.status !== "huy" && createdAt >= sevenDaysAgo) revenue7Days += o.total_amount;
    }
    const pending = counts.get("cho_thanh_toan") ?? 0;
    return { ordersToday, revenue7Days, pending };
  }, [orders, counts]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  async function openDetail(order: Order) {
    setDetailOrder(order);
    setNextStatus(order.status);
    setDetailItems([]);
    setDetailLoading(true);
    const { data, error } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    if (!error) setDetailItems((data as OrderItem[]) ?? []);
    setDetailLoading(false);
  }

  async function saveStatus() {
    if (!detailOrder) return;
    setSaving(true);
    const patch: Partial<Order> = { status: nextStatus };
    // confirmed_at/confirmed_by ghi lại đúng 1 lần — thời điểm nhân sự đầu
    // tiên thao tác trên đơn (thường là lúc xác nhận đã nhận được chuyển
    // khoản), không ghi đè lại ở các lần đổi status sau đó.
    if (!detailOrder.confirmed_at) {
      patch.confirmed_at = new Date().toISOString();
      patch.confirmed_by = userId;
    }
    const { data, error } = await supabase.from("orders").update(patch).eq("id", detailOrder.id).select().single();
    setSaving(false);
    if (error) {
      alert("Cập nhật đơn hàng thất bại: " + error.message);
      return;
    }
    const updated = data as Order;
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setDetailOrder(updated);
  }

  const detailTotal = detailItems.reduce((sum, it) => sum + it.thanh_tien, 0);

  return (
    <div className="app table-page">
      <div className="view-header">
        <div>
          <h1>Đơn hàng</h1>
          <p>Đơn đặt từ website — xem chi tiết và cập nhật trạng thái xử lý.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Đơn hôm nay</div>
          <div className="value">{stats.ordersToday}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Doanh thu 7 ngày qua</div>
          <div className="value">{formatVnd(stats.revenue7Days)}đ</div>
        </div>
        <div className="kpi-card">
          <div className="label">Chờ thanh toán</div>
          <div className="value accent">{stats.pending}</div>
        </div>
      </div>

      <Segmented
        style={{ marginBottom: 14 }}
        items={[
          { key: "all", label: `Tất cả (${orders.length})`, active: statusFilter === "all", onClick: () => setStatusFilter("all") },
          ...STATUS_ORDER.map((s) => ({
            key: s,
            label: `${STATUS_LABEL[s]} (${counts.get(s) ?? 0})`,
            active: statusFilter === s,
            onClick: () => setStatusFilter(s),
          })),
        ]}
      />

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th className="num">Tổng tiền</th>
                <th>Thanh toán</th>
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
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_code}</td>
                  <td>
                    <div>{o.customer_name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{o.customer_phone}</div>
                  </td>
                  <td>{formatDate(o.created_at)}</td>
                  <td className="num">{formatVnd(o.total_amount)}đ</td>
                  <td>{PAYMENT_LABEL[o.payment_method]}</td>
                  <td className="col-status">
                    <StatusBadge status={o.status} />
                  </td>
                  <td>
                    <button className="btn btn-quiet" onClick={() => openDetail(o)}>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailOrder && (
        <div className="panel-backdrop" onClick={(e) => e.target === e.currentTarget && setDetailOrder(null)}>
          <div className="panel-slide">
            <h2>Đơn {detailOrder.order_code}</h2>
            <p className="modal-sub">
              {detailOrder.customer_name} · {detailOrder.customer_phone}
            </p>

            <div className="field-group">
              {detailOrder.customer_address && <p style={{ margin: 0 }}>Địa chỉ: {detailOrder.customer_address}</p>}
              {detailOrder.note && <p style={{ margin: 0 }}>Ghi chú: {detailOrder.note}</p>}
              <p style={{ margin: 0 }}>Thanh toán: {PAYMENT_LABEL[detailOrder.payment_method]}</p>
              <p style={{ margin: 0 }}>Đặt lúc: {formatDate(detailOrder.created_at)}</p>
              {detailOrder.confirmed_at && <p style={{ margin: 0 }}>Xác nhận lúc: {formatDate(detailOrder.confirmed_at)}</p>}
            </div>

            <div className="table-card" style={{ marginTop: 10 }}>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Đơn vị</th>
                      <th className="num">Đơn giá</th>
                      <th className="num">SL</th>
                      <th className="num">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLoading && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                          Đang tải...
                        </td>
                      </tr>
                    )}
                    {!detailLoading &&
                      detailItems.map((it) => (
                        <tr key={it.id}>
                          <td>{it.ten_hang_hoa}</td>
                          <td>{it.don_vi === "thung" ? "Thùng" : "Lẻ"}</td>
                          <td className="num">{formatVnd(it.don_gia)}đ</td>
                          <td className="num">{it.so_luong}</td>
                          <td className="num">{formatVnd(it.thanh_tien)}đ</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p style={{ textAlign: "right", fontWeight: 600, margin: "8px 0 0" }}>Tổng cộng: {formatVnd(detailTotal)}đ</p>

            <div className="field-group" style={{ marginTop: 14 }}>
              <label>
                Trạng thái
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as OrderStatus)}>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn" type="button" onClick={() => setDetailOrder(null)}>
                Đóng
              </button>
              <button className="btn btn-primary" type="button" disabled={saving || nextStatus === detailOrder.status} onClick={saveStatus}>
                {saving ? "Đang lưu..." : "Lưu trạng thái"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
