"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import { formatVnd, formatDate } from "@/lib/admin/format";
import type { Order, OrderStatus, Product, View } from "@/lib/admin/types";

const STATUS_ORDER: OrderStatus[] = ["cho_thanh_toan", "da_thanh_toan", "dang_xu_ly", "dang_giao", "hoan_thanh", "huy"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  cho_thanh_toan: "Chờ thanh toán",
  da_thanh_toan: "Đã thanh toán",
  dang_xu_ly: "Đang xử lý",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  huy: "Đã huỷ",
};

// "Tổng quan" — landing page mới khi đăng nhập, tổng hợp số liệu ĐƠN HÀNG
// (mới, chưa nơi nào có trước OrdersView) + 1 số cross-link sang sản phẩm.
// Khác với "Báo cáo" (DashboardView, view "baocao") vốn chỉ xoay quanh
// sản phẩm/lịch sử giá — không trùng nội dung, không xoá/thay view đó.
export default function OverviewView({ products, onNavigate }: { products: Product[]; onNavigate: (v: View) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (!cancelled) {
        if (!error) setOrders((data as Order[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const missingPrice = useMemo(() => products.filter((p) => !p.gia_ban).length, [products]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let ordersToday = 0;
    let ordersThisMonth = 0;
    let revenueThisMonth = 0;
    const byStatus = new Map<OrderStatus, number>();
    for (const o of orders) {
      const createdAt = new Date(o.created_at);
      if (createdAt >= startOfToday) ordersToday++;
      if (createdAt >= startOfMonth) {
        ordersThisMonth++;
        if (o.status !== "huy") revenueThisMonth += o.total_amount;
      }
      byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
    }
    return { ordersToday, ordersThisMonth, revenueThisMonth, pending: byStatus.get("cho_thanh_toan") ?? 0, byStatus };
  }, [orders]);

  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((s) => stats.byStatus.get(s) ?? 0));
  const recentOrders = orders.slice(0, 6);

  return (
    <div className="app">
      <div className="view-header">
        <div>
          <h1>Tổng quan</h1>
          <p>Snapshot đơn hàng và những việc cần chú ý ngay.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Đơn hôm nay</div>
          <div className="value">{loading ? "—" : stats.ordersToday}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Doanh thu tháng này</div>
          <div className="value">{loading ? "—" : `${formatVnd(stats.revenueThisMonth)}đ`}</div>
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
