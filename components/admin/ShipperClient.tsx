"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import { clusterByDistance, DEFAULT_CLUSTER_RADIUS_KM } from "@/lib/admin/routeClustering";
import type { Order, PaymentMethod, Role } from "@/lib/admin/types";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  chuyen_khoan: "Đã chuyển khoản (VietQR)",
  cod: "Thu tiền mặt khi giao (COD)",
};

function hasCoords(o: Order): o is Order & { lat: number; lng: number } {
  return o.lat != null && o.lng != null;
}

// Trang riêng cho shipper — tối giản, tối ưu điện thoại, KHÔNG dùng chung
// khung admin đầy đủ (không lộ bảng sản phẩm/giá không liên quan). RLS
// (supabase/migrations/007a/007b_shipper_and_status_history.sql) đã tự giới hạn
// query dưới đây chỉ trả về: đơn "Đang xử lý" chưa ai nhận + đơn đã là của
// chính shipper này — không cần lọc thêm gì ở phía client cho phần bảo mật,
// chỉ tách hiển thị thành 2 danh sách cho rõ. Admin xem trang này (chính sách
// RLS của admin vốn đã thấy MỌI đơn) thì query trả về nhiều hơn, nhưng 2 bộ
// lọc `available`/`mine` bên dưới vẫn tự thu hẹp đúng ý nghĩa hiển thị.
export default function ShipperClient({ displayName, userId, role }: { displayName: string; userId: string; role: Role }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [claimingRoute, setClaimingRoute] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      // Geocode "nền" các đơn chưa có toạ độ trước khi tải lại danh sách —
      // xem app/api/admin/orders/geocode-pending/route.ts. Gọi mỗi lần tải
      // lại (kể cả từ realtime) để đơn MỚI vừa vào cũng kịp có toạ độ cho lần
      // gom tuyến kế tiếp; route này tự bỏ qua nếu không còn đơn nào thiếu
      // toạ độ nên gọi thường xuyên không tốn kém.
      try {
        await fetch("/api/admin/orders/geocode-pending", { method: "POST" });
      } catch {
        // Lỗi mạng/geocode không chặn việc xem đơn — đơn chưa có toạ độ chỉ
        // đơn giản rơi vào nhóm "Đơn lẻ" bên dưới thay vì gộp tuyến.
      }
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
      if (!cancelled) {
        if (!error) setOrders((data as Order[]) ?? []);
        setLoading(false);
      }
    }
    refresh();

    // Realtime — nhiều shipper cùng xem 1 danh sách "sẵn sàng nhận", cần
    // thấy ngay khi có đơn mới hoặc khi ai đó vừa nhận mất 1 đơn (biến mất
    // khỏi danh sách của mình).
    const channel = supabase
      .channel("orders-shipper")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const available = orders.filter((o) => o.status === "dang_xu_ly" && !o.shipper_id);
  const mine = orders.filter((o) => o.shipper_id === userId && o.status === "dang_giao");

  // Gom các đơn "sẵn sàng nhận" ĐÃ có toạ độ thành từng tuyến theo khoảng
  // cách thật (xem lib/admin/routeClustering.ts) — chỉ cụm ≥2 đơn mới tính
  // là 1 "Tuyến" có nút nhận gộp; cụm lẻ 1 đơn + đơn chưa geocode được gộp
  // chung vào danh sách "Đơn lẻ" phía dưới, vẫn nhận được bình thường từng
  // đơn một.
  const { routes, singles } = useMemo(() => {
    const geocoded = available.filter(hasCoords);
    const notGeocoded = available.filter((o) => !hasCoords(o));
    const clusters = clusterByDistance(geocoded);
    return {
      routes: clusters.filter((c) => c.length >= 2),
      singles: [...clusters.filter((c) => c.length === 1).flat(), ...notGeocoded],
    };
  }, [available]);

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

  // Nhận nguyên 1 tuyến — lặp từng đơn qua ĐÚNG cơ chế UPDATE có điều kiện
  // race-safe như claimOrder (không dùng .in() cho cả cụm, để 1 đơn bị người
  // khác nhận mất giữa chừng không làm hỏng các đơn còn lại trong tuyến).
  async function claimRoute(cluster: Order[], index: number) {
    setClaimingRoute(index);
    let claimed = 0;
    for (const order of cluster) {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "dang_giao", shipper_id: userId })
        .eq("id", order.id)
        .eq("status", "dang_xu_ly")
        .is("shipper_id", null)
        .select()
        .maybeSingle();
      if (!error && data) {
        await supabase.from("order_status_history").insert({ order_id: order.id, status: "dang_giao", changed_by: userId });
        claimed++;
      }
    }
    setClaimingRoute(null);
    if (claimed < cluster.length) {
      alert(`Đã nhận ${claimed}/${cluster.length} đơn trong tuyến — ${cluster.length - claimed} đơn vừa được shipper khác nhận mất.`);
    }
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
        <div className="shipper-header-actions">
          {role === "admin" && (
            <Link className="btn btn-quiet" href="/admin">
              Quay lại trang Admin
            </Link>
          )}
          <button className="btn btn-quiet" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
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
              <>
                {routes.map((cluster, i) => (
                  <div className="shipper-route" key={`route-${i}`}>
                    <div className="shipper-route-head">
                      <span>
                        Tuyến {i + 1} — {cluster.length} đơn (trong bán kính ~{DEFAULT_CLUSTER_RADIUS_KM}km)
                      </span>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={claimingRoute === i}
                        onClick={() => claimRoute(cluster, i)}
                      >
                        {claimingRoute === i ? "Đang nhận..." : `Nhận cả tuyến (${cluster.length})`}
                      </button>
                    </div>
                    {cluster.map((o) => (
                      <OrderCard key={o.id} order={o} actionLabel="Nhận đơn" busy={busyId === o.id} onAction={() => claimOrder(o)} />
                    ))}
                  </div>
                ))}
                {singles.length > 0 && (
                  <div className="shipper-route">
                    {routes.length > 0 && <div className="shipper-route-head">Đơn lẻ ({singles.length})</div>}
                    {singles.map((o) => (
                      <OrderCard key={o.id} order={o} actionLabel="Nhận đơn" busy={busyId === o.id} onAction={() => claimOrder(o)} />
                    ))}
                  </div>
                )}
              </>
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
