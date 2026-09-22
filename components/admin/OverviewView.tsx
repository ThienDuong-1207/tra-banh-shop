"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import type { Order, OrderItem, OrderStatus, Product, View } from "@/lib/admin/types";

const STATUS_ORDER: OrderStatus[] = ["cho_thanh_toan", "da_thanh_toan", "dang_xu_ly", "dang_giao", "hoan_thanh", "huy"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
  dang_xu_ly: "Đang xử lý",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  huy: "Đã huỷ",
};

const WEEKDAY_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

// So sánh trung thực — không suy ra % khi kỳ trước = 0 (chia cho 0 ra số vô
// nghĩa/phóng đại), chỉ nói rõ "chưa có gì để so" thay vì bịa số.
function deltaLabel(current: number, previous: number): { text: string; className: string } {
  if (previous === 0) {
    return current === 0 ? { text: "Chưa có dữ liệu", className: "flat" } : { text: "Mới phát sinh", className: "" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "Không đổi so với trước", className: "flat" };
  return { text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% so với trước`, className: pct > 0 ? "" : "warm" };
}

// Sparkline vẽ đúng dữ liệu thật 7 ngày qua — KHÔNG dùng số mẫu giả (đã trao
// đổi rõ với chủ dự án). Toàn bộ giá trị = 0 (shop mới/chưa có đơn) → hiện
// chữ "Chưa đủ dữ liệu" thay vì vẽ đường cong bịa ra.
function Sparkline({ values }: { values: number[] }) {
  const allZero = values.every((v) => v === 0);
  if (allZero) return <div className="sparkline-empty">Chưa đủ dữ liệu</div>;
  const w = 84;
  const h = 28;
  const max = Math.max(...values);
  const step = w / (values.length - 1 || 1);
  const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// "Tổng quan" — landing page mới khi đăng nhập, tổng hợp số liệu ĐƠN HÀNG
// (mới, chưa nơi nào có trước OrdersView) + 1 số cross-link sang sản phẩm.
// Khác với "Báo cáo" (DashboardView, view "baocao") vốn chỉ xoay quanh
// sản phẩm/lịch sử giá — không trùng nội dung, không xoá/thay view đó.
export default function OverviewView({
  products,
  displayName,
  onNavigate,
}: {
  products: Product[];
  displayName: string;
  onNavigate: (v: View) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (cancelled) return;
      const ordersData = (data as Order[]) ?? [];
      if (!error) setOrders(ordersData);

      // Sản phẩm bán chạy — chỉ cần order_items của các đơn trong 30 ngày
      // gần nhất (đã có sẵn id từ query orders ở trên), không quét toàn bộ
      // lịch sử.
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const recentIds = ordersData.filter((o) => new Date(o.created_at) >= cutoff).map((o) => o.id);
      if (recentIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase.from("order_items").select("*").in("order_id", recentIds);
        if (!cancelled && !itemsError) setOrderItems((itemsData as OrderItem[]) ?? []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const missingPrice = useMemo(() => products.filter((p) => !p.gia_ban).length, [products]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let ordersToday = 0;
    let ordersYesterday = 0;
    let ordersThisMonth = 0;
    let revenueThisMonth = 0;
    let revenueLastMonth = 0;
    const byStatus = new Map<OrderStatus, number>();

    // 7 gầu chứa theo ngày cho sparkline — luôn dựng đủ 7 ô kể cả ngày rỗng,
    // để trục thời gian nhất quán thay vì co giãn theo dữ liệu có sẵn.
    const dayBuckets: { key: string; label: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dayBuckets.push({ key: d.toISOString().slice(0, 10), label: WEEKDAY_LABEL[d.getDay()], orders: 0, revenue: 0 });
    }
    const bucketByKey = new Map(dayBuckets.map((b) => [b.key, b]));

    for (const o of orders) {
      const createdAt = new Date(o.created_at);
      if (createdAt >= startOfToday) ordersToday++;
      else if (createdAt >= startOfYesterday) ordersYesterday++;
      if (createdAt >= startOfMonth) {
        ordersThisMonth++;
        if (o.status !== "huy") revenueThisMonth += o.total_amount;
      } else if (createdAt >= startOfLastMonth) {
        if (o.status !== "huy") revenueLastMonth += o.total_amount;
      }
      byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

      const bucket = bucketByKey.get(o.created_at.slice(0, 10));
      if (bucket) {
        bucket.orders++;
        if (o.status !== "huy") bucket.revenue += o.total_amount;
      }
    }

    return {
      ordersToday,
      ordersYesterday,
      ordersThisMonth,
      revenueThisMonth,
      revenueLastMonth,
      pending: byStatus.get("cho_thanh_toan") ?? 0,
      byStatus,
      dayBuckets,
    };
  }, [orders]);

  const topProducts = useMemo(() => {
    const byProduct = new Map<string, { name: string; qty: number }>();
    for (const it of orderItems) {
      const cur = byProduct.get(it.product_id);
      if (cur) cur.qty += it.so_luong;
      else byProduct.set(it.product_id, { name: it.ten_hang_hoa, qty: it.so_luong });
    }
    const productById = new Map(products.map((p) => [p.id, p]));
    return [...byProduct.entries()]
      .map(([id, v]) => ({ id, name: v.name, qty: v.qty, photo_url: productById.get(id)?.photo_url ?? null }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orderItems, products]);

  const maxTopProductQty = Math.max(1, ...topProducts.map((p) => p.qty));
  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((s) => stats.byStatus.get(s) ?? 0));
  const recentOrders = orders.slice(0, 6);

  const orderDelta = deltaLabel(stats.ordersToday, stats.ordersYesterday);
  const revenueDelta = deltaLabel(stats.revenueThisMonth, stats.revenueLastMonth);

  return (
    <div className="app">
      <div className="view-header">
        <div>
          <h1>
            {greeting(new Date())}, {displayName.split(" ").slice(-1)[0] || displayName}!
          </h1>
          <p>
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })} — snapshot
            đơn hàng và những việc cần chú ý ngay.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card-spark">
          <div className="kpi-card-top">
            <div className="label">Đơn hôm nay</div>
            <Sparkline values={stats.dayBuckets.map((b) => b.orders)} />
          </div>
          <div className="value">{loading ? "—" : stats.ordersToday}</div>
          {!loading && <div className={`delta ${orderDelta.className}`}>{orderDelta.text}</div>}
        </div>
        <div className="kpi-card kpi-card-spark">
          <div className="kpi-card-top">
            <div className="label">Doanh thu tháng này</div>
            <Sparkline values={stats.dayBuckets.map((b) => b.revenue)} />
          </div>
          <div className="value">{loading ? "—" : `${formatVnd(stats.revenueThisMonth)}đ`}</div>
          {!loading && <div className={`delta ${revenueDelta.className}`}>{revenueDelta.text}</div>}
        </div>
        <div className="kpi-card">
          <div className="label">Đơn chờ thanh toán</div>
          <div className="value accent">{loading ? "—" : stats.pending}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Sản phẩm thiếu giá</div>
          <div className="value accent">{missingPrice}</div>
        </div>
      </div>

      <div className="panels">
        <div className="panel">
          <h3>Đơn hàng theo trạng thái</h3>
          <div className="panel-scroll">
            {STATUS_ORDER.map((s) => {
              const count = stats.byStatus.get(s) ?? 0;
              return (
                <div className="bar-row" key={s}>
                  <div className="cat-name">{STATUS_LABEL[s]}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </div>
                  <div className="n">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel" style={{ gridColumn: "span 2" }}>
          <h3>Sản phẩm bán chạy (30 ngày qua)</h3>
          {topProducts.length === 0 ? (
            <div className="empty-state">Chưa có đơn hàng nào trong 30 ngày qua.</div>
          ) : (
            <div>
              {topProducts.map((p) => (
                <div className="top-product-row" key={p.id}>
                  <div className="top-product-thumb">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt={p.name} />
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className="top-product-info">
                    <div className="top-product-name">{p.name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(p.qty / maxTopProductQty) * 100}%` }} />
                    </div>
                  </div>
                  <div className="top-product-meta">Đã bán {p.qty}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel" style={{ gridColumn: "span 3" }}>
          <h3>Đơn hàng gần đây</h3>
          <div className="table-card" style={{ boxShadow: "none", border: "none" }}>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Ngày đặt</th>
                    <th className="num">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Đang tải...
                      </td>
                    </tr>
                  )}
                  {!loading && recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Chưa có đơn hàng nào.
                      </td>
                    </tr>
                  )}
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.order_code}</td>
                      <td>{o.customer_name}</td>
                      <td>{formatDate(o.created_at)}</td>
                      <td className="num">{formatVnd(o.total_amount)}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button className="btn btn-quiet" style={{ marginTop: 12, alignSelf: "flex-start" }} onClick={() => onNavigate("donhang")}>
            Xem tất cả đơn hàng →
          </button>
        </div>
      </div>
    </div>
  );
}
