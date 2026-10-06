"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import { clusterByDistance, orderByNearestNeighbor, DEFAULT_CLUSTER_RADIUS_KM } from "@/lib/admin/routeClustering";
import NotificationBell from "@/components/admin/NotificationBell";
import { PhoneIcon, MapPinIcon, ReceiptIcon, TagIcon, ArrowLeftIcon } from "@/components/admin/icons";
import type { Order, PaymentMethod, Role } from "@/lib/admin/types";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  chuyen_khoan: "Đã chuyển khoản (VietQR)",
  cod: "Thu tiền mặt khi giao (COD)",
};

function hasCoords(o: Order): o is Order & { lat: number; lng: number } {
  return o.lat != null && o.lng != null;
}

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Trang riêng cho shipper — tối giản, tối ưu điện thoại, KHÔNG dùng chung
// khung admin đầy đủ (không lộ bảng sản phẩm/giá không liên quan). RLS
// (supabase/migrations/007a/007b_shipper_and_status_history.sql) đã tự giới hạn
// query dưới đây chỉ trả về: đơn "Đang xử lý" chưa ai nhận + đơn đã là của
// chính shipper này — không cần lọc thêm gì ở phía client cho phần bảo mật,
// chỉ tách hiển thị thành 2 tab cho rõ. Admin xem trang này (chính sách RLS
// của admin vốn đã thấy MỌI đơn) thì query trả về nhiều hơn, nhưng 2 bộ lọc
// `available`/`mine` bên dưới vẫn tự thu hẹp đúng ý nghĩa hiển thị.
export default function ShipperClient({ displayName, userId, role }: { displayName: string; userId: string; role: Role }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [claimingRoute, setClaimingRoute] = useState<number | null>(null);
  const [tab, setTab] = useState<"mine" | "available">("mine");
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [deliveredToday, setDeliveredToday] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Đếm THẬT số đơn đã giao hôm nay từ order_status_history (mốc thời gian
    // đáng tin — không suy ra từ orders.created_at vì đó là lúc TẠO đơn, có
    // thể tạo hôm qua nhưng giao hôm nay, hoặc ngược lại chưa giao xong).
    async function loadDeliveredToday() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("order_status_history")
        .select("id", { count: "exact", head: true })
        .eq("changed_by", userId)
        .eq("status", "hoan_thanh")
        .gte("changed_at", todayStart.toISOString());
      if (!cancelled) setDeliveredToday(count ?? 0);
    }

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
      loadDeliveredToday();
    }
    refresh();

    // Realtime — nhiều shipper cùng xem 1 danh sách "sẵn sàng nhận", cần
    // thấy ngay khi có đơn mới hoặc khi ai đó vừa nhận mất 1 đơn (biến mất
    // khỏi danh sách của mình).
    const channel = supabase
      .channel("orders-shipper")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refresh())
      .subscribe();

    // Điện thoại shipper thường bị khoá màn hình/chuyển sang app Bản đồ giữa
    // các lượt giao — trình duyệt di động có thể ngắt kết nối realtime khi
    // chạy nền. Tải lại ngay khi quay lại app thay vì chỉ trông chờ realtime,
    // tránh hiện danh sách cũ (đơn tưởng còn nhưng đã bị nhận/giao xong).
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  const available = orders.filter((o) => o.status === "dang_xu_ly" && !o.shipper_id);
  const mine = orders.filter((o) => o.shipper_id === userId && o.status === "dang_giao");

  // Sắp đơn ĐANG GIAO theo "gần nhất kế tiếp" — trả lời đúng câu hỏi thật
  // "giao đơn nào trước", thay vì theo thứ tự nhận (xem lib/admin/routeClustering.ts).
  const mineOrdered = useMemo(() => orderByNearestNeighbor(mine), [mine]);

  // Gom các đơn "sẵn sàng nhận" ĐÃ có toạ độ thành từng tuyến theo khoảng
  // cách thật — chỉ cụm ≥2 đơn mới tính là 1 "Tuyến" có nút nhận gộp; cụm lẻ
  // 1 đơn + đơn chưa geocode được gộp chung vào danh sách "Đơn lẻ" phía
  // dưới, vẫn nhận được bình thường từng đơn một.
  const { routes, singles } = useMemo(() => {
    const geocoded = available.filter(hasCoords);
    const notGeocoded = available.filter((o) => !hasCoords(o));
    const clusters = clusterByDistance(geocoded);
    return {
      routes: clusters.filter((c) => c.length >= 2),
      singles: [...clusters.filter((c) => c.length === 1).flat(), ...notGeocoded],
    };
  }, [available]);

  function toggleRoute(index: number) {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

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

  // Trả lại đơn đã nhận nhầm — đơn quay về "Có thể nhận" cho shipper khác
  // (kể cả chính mình) nhận lại. Race-safe cùng kiểu claimOnRow: chỉ trả
  // được đơn ĐANG thật sự là của mình (WHERE shipper_id = userId), tránh
  // trường hợp lỡ bấm 2 lần hoặc đơn đã đổi tay.
  async function releaseOrder(order: Order) {
    if (!confirm(`Trả lại đơn ${order.order_code}? Đơn sẽ quay lại danh sách "Có thể nhận" cho shipper khác.`)) return;
    setBusyId(order.id);
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "dang_xu_ly", shipper_id: null })
      .eq("id", order.id)
      .eq("shipper_id", userId)
      .select()
      .maybeSingle();
    setBusyId(null);
    if (error || !data) {
      alert("Trả đơn thất bại, thử lại nhé.");
      return;
    }
    await supabase.from("order_status_history").insert({ order_id: order.id, status: "dang_xu_ly", changed_by: userId });
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

  const todayDone = deliveredToday > 0 ? ` · Đã giao ${deliveredToday} đơn hôm nay` : "";

  return (
    <div className="shell shipper-shell">
      <nav className="sidebar shipper-sidebar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/templates/logo.png" alt="Trà & Bánh" />
          <div className="brand-text-under">Giao hàng</div>
        </div>
        <div className="nav">
          <div className="nav-label">Đơn hàng</div>
          <button className={`nav-item${tab === "mine" ? " active" : ""}`} onClick={() => setTab("mine")}>
            <ReceiptIcon />
            Đang giao
            <span className="pill pill-primary badge">{mine.length}</span>
          </button>
          <button className={`nav-item${tab === "available" ? " active" : ""}`} onClick={() => setTab("available")}>
            <TagIcon />
            Có thể nhận
            <span className="pill pill-warm badge">{available.length}</span>
          </button>
          {role === "admin" && (
            <Link href="/admin" className="nav-item">
              <ArrowLeftIcon />
              Quay lại trang Admin
            </Link>
          )}
        </div>
        <div className="sidebar-foot sidebar-account">
          <div className="sidebar-account-name">Xin chào, {displayName}</div>
          <div className="sidebar-account-role">
            Shipper{todayDone}
          </div>
          <button className="btn btn-quiet sidebar-signout" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <main className="main">
        <div className="topbar">
          <NotificationBell userId={userId} onNavigate={() => setTab("mine")} />
          <div className="topbar-avatar" title={displayName}>
            {(displayName.trim()[0] ?? "?").toUpperCase()}
          </div>
        </div>
        <div className="main-content">
          <div className="app shipper-app">
            {loading ? (
              <div className="loading-state">Đang tải...</div>
            ) : tab === "mine" ? (
              <section className="shipper-section">
                {mineOrdered.length === 0 ? (
                  <div className="empty-state">
                    Bạn chưa nhận đơn nào đang giao.
                    <br />
                    <button className="btn btn-quiet" style={{ marginTop: 10 }} onClick={() => setTab("available")}>
                      Xem đơn có thể nhận →
                    </button>
                  </div>
                ) : (
                  mineOrdered.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      actionLabel="Đã giao xong"
                      busy={busyId === o.id}
                      onAction={() => markDelivered(o)}
                      secondaryLabel="Trả đơn"
                      onSecondaryAction={() => releaseOrder(o)}
                    />
                  ))
                )}
              </section>
            ) : (
              <section className="shipper-section">
                {available.length === 0 ? (
                  <div className="empty-state">Chưa có đơn nào đang chờ giao.</div>
                ) : (
                  <>
                    {routes.map((cluster, i) => {
                      const expanded = expandedRoutes.has(i);
                      return (
                        <div className="shipper-route" key={`route-${i}`}>
                          <button className="shipper-route-head" onClick={() => toggleRoute(i)} aria-expanded={expanded}>
                            <span>
                              Tuyến {i + 1} — {cluster.length} đơn (trong bán kính ~{DEFAULT_CLUSTER_RADIUS_KM}km)
                            </span>
                            <span className={`shipper-route-chevron${expanded ? " open" : ""}`}>⌄</span>
                          </button>
                          {expanded && (
                            <>
                              {cluster.map((o) => (
                                <OrderCard key={o.id} order={o} actionLabel="Nhận đơn" busy={busyId === o.id} onAction={() => claimOrder(o)} />
                              ))}
                              {/* Đặt nút nhận gộp SAU khi đã thấy hết đơn trong tuyến —
                                  không cho nhận "mù" cả cụm trước khi mở ra xem từng đơn
                                  (địa chỉ/số tiền/thanh toán) bên trong. */}
                              <button
                                className="btn btn-primary btn-sm shipper-route-claim"
                                disabled={claimingRoute === i}
                                onClick={() => claimRoute(cluster, i)}
                              >
                                {claimingRoute === i ? "Đang nhận..." : `Nhận cả tuyến (${cluster.length})`}
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {singles.length > 0 && (
                      <div className="shipper-route shipper-route-wide">
                        {routes.length > 0 && <div className="shipper-route-head shipper-route-head-static">Đơn lẻ ({singles.length})</div>}
                        <div className="shipper-cards">
                          {singles.map((o) => (
                            <OrderCard key={o.id} order={o} actionLabel="Nhận đơn" busy={busyId === o.id} onAction={() => claimOrder(o)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </main>

      <nav className="shipper-tabbar">
        <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>
          Đang giao <span className="shipper-tab-count">{mine.length}</span>
        </button>
        <button className={tab === "available" ? "active" : ""} onClick={() => setTab("available")}>
          Có thể nhận <span className="shipper-tab-count">{available.length}</span>
        </button>
      </nav>
    </div>
  );
}

function OrderCard({
  order,
  actionLabel,
  busy,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}: {
  order: Order;
  actionLabel: string;
  busy: boolean;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="shipper-card">
      <div className="shipper-card-top">
        <span className="shipper-card-code">{order.order_code}</span>
        <span className="shipper-card-total">{formatVnd(order.total_amount)}đ</span>
      </div>
      <div className="shipper-card-row">{order.customer_name}</div>
      <a className="shipper-card-row shipper-card-phone" href={`tel:${order.customer_phone}`}>
        <PhoneIcon /> {order.customer_phone}
      </a>
      {order.customer_address && (
        <a
          className="shipper-card-row shipper-card-address"
          href={mapsUrl(order.customer_address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPinIcon /> {order.customer_address}
        </a>
      )}
      {order.note && <div className="shipper-card-row shipper-card-note">Ghi chú: {order.note}</div>}
      <div className={`shipper-card-payment${order.payment_method === "cod" ? " cod" : ""}`}>
        {PAYMENT_LABEL[order.payment_method]}
      </div>
      <div className="shipper-card-row shipper-card-time">Đặt lúc {formatDate(order.created_at)}</div>
      <div className="shipper-card-actions">
        {onSecondaryAction && (
          <button className="btn btn-quiet shipper-secondary-btn" disabled={busy} onClick={onSecondaryAction}>
            {secondaryLabel}
          </button>
        )}
        <button className="btn btn-primary shipper-action-btn" disabled={busy} onClick={onAction}>
          {busy ? "Đang xử lý..." : actionLabel}
        </button>
      </div>
    </div>
  );
}
