"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import type { Order, PaymentMethod } from "@/lib/admin/types";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  chuyen_khoan: "Đã chuyển khoản (VietQR)",
  cod: "Thu tiền mặt khi giao (COD)",
};

// Trang riêng cho shipper — tối giản, tối ưu điện thoại, KHÔNG dùng chung
// khung admin đầy đủ (không lộ bảng sản phẩm/giá không liên quan). RLS
// (supabase/migrations/007_shipper_and_status_history.sql) đã tự giới hạn
// query dưới đây chỉ trả về: đơn "Đang xử lý" chưa ai nhận + đơn đã là của
// chính shipper này — không cần lọc thêm gì ở phía client cho phần bảo mật,
// chỉ tách hiển thị thành 2 danh sách cho rõ.
export default function ShipperClient({ displayName, userId }: { displayName: string; userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
      if (!cancelled) {
        if (!error) setOrders((data as Order[]) ?? []);
        setLoading(false);
      }
    }
    load();

    // Realtime — nhiều shipper cùng xem 1 danh sách "sẵn sàng nhận", cần
    // thấy ngay khi có đơn mới hoặc khi ai đó vừa nhận mất 1 đơn (biến mất
    // khỏi danh sách của mình).
    const channel = supabase
      .channel("orders-shipper")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const available = orders.filter((o) => o.status === "dang_xu_ly" && !o.shipper_id);
  const mine = orders.filter((o) => o.shipper_id === userId && o.status === "dang_giao");

  async function claimOrder(order: Order) {
    setBusyId(order.id);
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "dang_giao", shipper_id: userId })
      .eq("id", order.id)
      .eq("status", "dang_xu_ly")
      .is("shipper_id", null)
      .select()
      .maybeSingle();
    setBusyId(null);
    if (error || !data) {
      // Realtime subscription sẽ tự tải lại danh sách đúng ngay sau đây —
      // không tự sửa state cục bộ ở đây vì không biết chắc ai đã nhận mất.
      alert("Đơn này vừa được shipper khác nhận rồi, bạn thử đơn khác nhé.");
      return;
    }
    await supabase.from("order_status_history").insert({ order_id: order.id, status: "dang_giao", changed_by: userId });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? (data as Order) : o)));
  }

  async function markDelivered(order: Order) {
    if (!confirm(`Xác nhận đã giao đơn ${order.order_code}?`)) return;
    setBusyId(order.id);
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "hoan_thanh" })
      .eq("id", order.id)
      .eq("shipper_id", userId)
      .select()
      .maybeSingle();
    setBusyId(null);
    if (error || !data) {
      alert("Cập nhật thất bại, thử lại nhé.");
      return;
    }
    await supabase.from("order_status_history").insert({ order_id: order.id, status: "hoan_thanh", changed_by: userId });
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/admin/login");
  }

  return (
    <div className="shipper-shell">
      <header className="shipper-header">
        <div>
          <div className="shipper-header-title">Xin chào, {displayName}</div>
          <div className="shipper-header-sub">Giao hàng — Trà &amp; Bánh</div>
        </div>
        <button className="btn btn-quiet" onClick={signOut}>
          Đăng xuất
        </button>
      </header>

      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : (
        <>
          <section className="shipper-section">
            <h2>Đơn của tôi ({mine.length})</h2>
            {mine.length === 0 ? (
              <div className="empty-state">Bạn chưa nhận đơn nào đang giao.</div>
            ) : (
              mine.map((o) => (
                <OrderCard key={o.id} order={o} actionLabel="Đã giao xong" busy={busyId === o.id} onAction={() => markDelivered(o)} />
              ))
            )}
          </section>

          <section className="shipper-section">
            <h2>Đơn sẵn sàng nhận ({available.length})</h2>
            {available.length === 0 ? (
              <div className="empty-state">Chưa có đơn nào đang chờ giao.</div>
            ) : (
              available.map((o) => (
                <OrderCard key={o.id} order={o} actionLabel="Nhận đơn" busy={busyId === o.id} onAction={() => claimOrder(o)} />
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  actionLabel,
  busy,
  onAction,
}: {
  order: Order;
  actionLabel: string;
  busy: boolean;
  onAction: () => void;
}) {
  return (
    <div className="shipper-card">
      <div className="shipper-card-top">
        <span className="shipper-card-code">{order.order_code}</span>
        <span className="shipper-card-total">{formatVnd(order.total_amount)}đ</span>
      </div>
      <div className="shipper-card-row">{order.customer_name}</div>
      <a className="shipper-card-row shipper-card-phone" href={`tel:${order.customer_phone}`}>
        📞 {order.customer_phone}
      </a>
      {order.customer_address && <div className="shipper-card-row">{order.customer_address}</div>}
      {order.note && <div className="shipper-card-row shipper-card-note">Ghi chú: {order.note}</div>}
      <div className={`shipper-card-payment${order.payment_method === "cod" ? " cod" : ""}`}>
        {PAYMENT_LABEL[order.payment_method]}
      </div>
      <div className="shipper-card-row shipper-card-time">Đặt lúc {formatDate(order.created_at)}</div>
      <button className="btn btn-primary shipper-action-btn" disabled={busy} onClick={onAction}>
        {busy ? "Đang xử lý..." : actionLabel}
      </button>
    </div>
  );
}
