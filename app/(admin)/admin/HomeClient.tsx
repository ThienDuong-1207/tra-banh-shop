"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import {
  View,
  Role,
  Product,
  PriceChangeRequest,
  PriceHistoryEntry,
  Profile,
  ActivityLogEntry,
  CATEGORY_ORDER,
} from "@/lib/admin/types";
import { ACTION_LABELS } from "@/lib/admin/activityLabels";
import { formatVnd, formatDate, relativeTimeVi, downloadBlob } from "@/lib/admin/format";
import PasswordChecklist from "@/components/admin/PasswordChecklist";
import Segmented from "@/components/admin/Segmented";
import Field from "@/components/admin/Field";
import { TrashIcon, MenuIcon, TagIcon, UsersIcon, ReceiptIcon } from "@/components/admin/icons";
import NotificationBell from "@/components/admin/NotificationBell";
import OrdersView from "@/components/admin/OrdersView";
import OverviewView from "@/components/admin/OverviewView";
import CustomersView from "@/components/admin/CustomersView";
import ShopSettingsView from "@/components/admin/ShopSettingsView";
import CouponsView from "@/components/admin/CouponsView";
import ProductsView from "@/components/admin/ProductsView";

export type { Role };

// Tạm ẩn các nav ngoài phạm vi yêu cầu hiện tại (chỉ giữ Tổng quan/Quản lý
// hàng hóa/Đơn hàng — sau này thêm Tin nhắn) — đổi cờ tương ứng thành true
// để hiện lại, không mất code/dữ liệu bên dưới.
const SHOW_INVENTORY_NAV = false;
const SHOW_PRICE_APPROVAL_NAV = false;
const SHOW_ACTIVITY_LOG_NAV = false;
const SHOW_REPORTS_NAV = false;
const SHOW_USERS_NAV = false;

const ROLE_LABEL: Record<Role, string> = {
  sales: "Sales",
  accountant: "Kế toán",
  admin: "Admin",
  staff: "Nhân viên",
  shipper: "Shipper",
};

export default function HomeClient({ displayName, role, userId }: { displayName: string; role: Role; userId: string }) {
  const [activeView, setActiveView] = useState<View>("tongquan");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [priceRequests, setPriceRequests] = useState<PriceChangeRequest[]>([]);
  const [priceHistoryRefreshToken, setPriceHistoryRefreshToken] = useState(0);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  // "Quản lý hàng hóa" (ProductsView) tự tải bản products/price_change_requests
  // riêng của nó — bản ở đây chỉ phục vụ Tổng quan/Báo cáo/Chờ duyệt giá/badge
  // Sidebar, xem docs/component-conventions.md.
  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, brand:brands(name)")
      .order("category_sheet", { ascending: true })
      .order("ten_hang_hoa", { ascending: true });
    if (error) {
      alert("Lỗi tải dữ liệu: " + error.message);
    } else {
      setProducts(data as Product[]);
    }
  }, []);

  // RLS already scopes this per role: sales only sees their own requests,
  // kế toán/admin sees everyone's — so no client-side filtering by "who can
  // see what" is needed here.
  // Chỉ tải các đề xuất đang "pending" — đây là hàng chờ xử lý thực sự nên
  // luôn nhỏ (được duyệt/từ chối là biến mất khỏi tập này ngay). Lịch sử
  // approved/rejected (tăng dần không giới hạn theo thời gian) được tách
  // riêng, tự tải + phân trang bên trong PriceRequestsView.
  const loadPriceRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("price_change_requests")
      .select(
        "*, product:products(ten_hang_hoa, ma_noi_bo, gia_ban, gia_thung), proposer:profiles!price_change_requests_proposed_by_fkey(display_name, username)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error) setPriceRequests((data ?? []) as PriceChangeRequest[]);
  }, []);

  useEffect(() => {
    loadProducts();
    loadPriceRequests();
  }, []);

  const pendingIds = useMemo(
    () =>
      new Set(
        products
          .filter((p) => !p.last_exported_at || new Date(p.updated_at) > new Date(p.last_exported_at))
          .map((p) => p.id)
      ),
    [products]
  );

  async function reviewPriceRequest(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("Từ chối đề xuất giá này?")) return;
    setReviewingRequestId(id);
    try {
      const res = await fetch(`/api/admin/price-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xử lý thất bại");
      await Promise.all([loadPriceRequests(), action === "approve" ? loadProducts() : Promise.resolve()]);
      setPriceHistoryRefreshToken((v) => v + 1);
    } catch (e: any) {
      alert("Xử lý đề xuất thất bại: " + e.message);
    } finally {
      setReviewingRequestId(null);
    }
  }

  async function approveAllPriceRequests(): Promise<boolean> {
    if (!confirm("Duyệt toàn bộ đề xuất giá đang chờ? Không thể hoàn tác.")) return false;
    setApprovingAll(true);
    try {
      const res = await fetch("/api/admin/price-requests/approve-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duyệt tất cả thất bại");
      await Promise.all([loadPriceRequests(), loadProducts()]);
      setPriceHistoryRefreshToken((v) => v + 1);
      return true;
    } catch (e: any) {
      alert("Duyệt tất cả thất bại: " + e.message);
      return false;
    } finally {
      setApprovingAll(false);
    }
  }

  return (
    <div className="shell">
      <Sidebar
        activeView={activeView}
        onChange={(v) => {
          setActiveView(v);
          setMobileNavOpen(false);
        }}
        priceRequestCount={priceRequests.filter((r) => r.status === "pending").length}
        displayName={displayName}
        role={role}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
      />
      <main className="main">
        <div className="topbar">
          <NotificationBell userId={userId} onNavigate={(v) => setActiveView(v as View)} />
          <div className="topbar-avatar" title={displayName}>
            {(displayName.trim()[0] ?? "?").toUpperCase()}
          </div>
        </div>
        <div className="main-content">
        {activeView === "hanghoa" && <ProductsView role={role} />}
        {activeView === "tongquan" && <OverviewView products={products} displayName={displayName} onNavigate={setActiveView} />}
        {activeView === "donhang" && <OrdersView userId={userId} />}
        {activeView === "khachhang" && <CustomersView />}
        {activeView === "caidat" && role === "admin" && <ShopSettingsView userId={userId} />}
        {activeView === "khuyenmai" && <CouponsView />}
        {activeView === "tonkho" && <InventoryView />}
        {activeView === "baocao" && <DashboardView products={products} pendingCount={pendingIds.size} />}
        {activeView === "duyetgia" && (
          <PriceRequestsView
            requests={priceRequests}
            role={role}
            reviewingRequestId={reviewingRequestId}
            onReview={reviewPriceRequest}
            approvingAll={approvingAll}
            onApproveAll={approveAllPriceRequests}
            historyRefreshToken={priceHistoryRefreshToken}
          />
        )}
        {activeView === "users" && role === "admin" && <UserManagementView currentUserId={userId} />}
        {activeView === "activitylog" && <ActivityLogView role={role} />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({
  activeView,
  onChange,
  priceRequestCount,
  displayName,
  role,
  mobileNavOpen,
  onToggleMobileNav,
}: {
  activeView: View;
  onChange: (v: View) => void;
  priceRequestCount: number;
  displayName: string;
  role: Role;
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
}) {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/admin/login");
  }

  return (
    <nav className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`}>
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/templates/logo.png" alt="Trà & Bánh" />
        <div className="brand-text-under">Quản lý sản phẩm</div>
        <button
          className="sidebar-mobile-toggle"
          aria-label={mobileNavOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileNavOpen}
          onClick={onToggleMobileNav}
        >
          <MenuIcon />
        </button>
      </div>
      {mobileNavOpen && <div className="sidebar-backdrop" onClick={onToggleMobileNav} />}
      <div className="nav">
        <div className="nav-label">Menu</div>
        <button className={`nav-item${activeView === "tongquan" ? " active" : ""}`} onClick={() => onChange("tongquan")}>
          <HomeIcon />
          Tổng quan
        </button>
        <button className={`nav-item${activeView === "hanghoa" ? " active" : ""}`} onClick={() => onChange("hanghoa")}>
          <TagIcon />
          Quản lý hàng hóa
        </button>
        <button className={`nav-item${activeView === "donhang" ? " active" : ""}`} onClick={() => onChange("donhang")}>
          <ReceiptIcon />
          Đơn hàng
        </button>
        <button className={`nav-item${activeView === "khachhang" ? " active" : ""}`} onClick={() => onChange("khachhang")}>
          <UsersIcon />
          Khách hàng
        </button>
        {role === "admin" && (
          <>
            <div className="nav-label">Quản trị</div>
            <button className={`nav-item${activeView === "khuyenmai" ? " active" : ""}`} onClick={() => onChange("khuyenmai")}>
              <TagPercentIcon />
              Mã khuyến mãi
            </button>
            <button className={`nav-item${activeView === "caidat" ? " active" : ""}`} onClick={() => onChange("caidat")}>
              <SettingsIcon />
              Cài đặt cửa hàng
            </button>
          </>
        )}
        {/* Ẩn các mục ngoài phạm vi yêu cầu hiện tại (Tổng quan/Sản phẩm/Đơn
            hàng/Tin nhắn) — không xoá code/dữ liệu, chỉ ẩn khỏi nav. Đổi cờ
            tương ứng thành true để hiện lại khi cần, cùng pattern
            SHOW_INVENTORY_NAV đã có sẵn. */}
        {SHOW_PRICE_APPROVAL_NAV && (
          <button className={`nav-item${activeView === "duyetgia" ? " active" : ""}`} onClick={() => onChange("duyetgia")}>
            <TagIcon />
            Chờ duyệt giá
            {priceRequestCount > 0 && <span className="pill pill-warm badge">{priceRequestCount}</span>}
          </button>
        )}
        {SHOW_ACTIVITY_LOG_NAV && (
          <button className={`nav-item${activeView === "activitylog" ? " active" : ""}`} onClick={() => onChange("activitylog")}>
            <LogIcon />
            Nhật ký hoạt động
          </button>
        )}
        {SHOW_REPORTS_NAV && (
          <button className={`nav-item${activeView === "baocao" ? " active" : ""}`} onClick={() => onChange("baocao")}>
            <ChartIcon />
            Báo cáo
          </button>
        )}
        {SHOW_USERS_NAV && role === "admin" && (
          <button className={`nav-item${activeView === "users" ? " active" : ""}`} onClick={() => onChange("users")}>
            <UsersIcon />
            Quản lý người dùng
          </button>
        )}
        {SHOW_INVENTORY_NAV && (
          <button className={`nav-item${activeView === "tonkho" ? " active" : ""}`} onClick={() => onChange("tonkho")}>
            <ArchiveIcon />
            Quản lý tồn kho
          </button>
        )}
      </div>
      <div className="sidebar-foot sidebar-account">
        <div className="sidebar-account-name">{displayName}</div>
        <div className="sidebar-account-role">{ROLE_LABEL[role]}</div>
        <button className="btn btn-quiet sidebar-signout" onClick={signOut}>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
}

// Biểu đồ đường tự vẽ bằng SVG (không thêm thư viện) — trục X dàn theo đúng
// vị trí thời gian thực (không chỉ theo thứ tự), trục Y co giãn theo đúng
// min/max của chính chuỗi đó (2 chuỗi Giá lẻ/Giá thùng lệch nhau nhiều lần
// nên mỗi chuỗi có 1 trục Y riêng, không dùng chung — nếu dùng chung, chuỗi
// giá trị nhỏ hơn hẳn sẽ nhìn như 1 đường thẳng phẳng lì).
function MiniLineChart({ points, color }: { points: { t: number; v: number }[]; color: string }) {
  if (points.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: 12.5 }}>Chưa có lịch sử.</p>;
  }
  const W = 600;
  const H = 130;
  const PAD_X = 8;
  const PAD_Y = 16;
  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const rangeT = maxT - minT || 1;
  const values = points.map((p) => p.v);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const rangeV = maxV - minV || 1;
  const xFor = (t: number) => (points.length === 1 ? W / 2 : PAD_X + ((t - minT) / rangeT) * (W - PAD_X * 2));
  const yFor = (v: number) => H - PAD_Y - ((v - minV) / rangeV) * (H - PAD_Y * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t).toFixed(1)} ${yFor(p.v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={xFor(p.t)} cy={yFor(p.v)} r={3} fill={color} />
      ))}
    </svg>
  );
}

// Nạp lịch sử giá RIÊNG bên trong view này (không đưa lên HomeClient) vì chỉ
// dùng cho báo cáo — giới hạn 3000 dòng gần nhất là đủ dư dùng ở quy mô hiện
// tại (~66 dòng); nếu về sau lịch sử phình to hơn nhiều, biểu đồ tháng/top 10
// có thể thiếu vài dòng cũ nhất, chấp nhận được cho 1 trang tổng quan nhanh.
function DashboardView({ products, pendingCount }: { products: Product[]; pendingCount: number }) {
  const missingPrice = products.filter((p) => !p.gia_ban).length;

  const [historyRows, setHistoryRows] = useState<PriceHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select("*, product:products(ten_hang_hoa, ma_noi_bo)")
        .order("changed_at", { ascending: false })
        .limit(3000);
      if (!cancelled) {
        if (!error) setHistoryRows((data ?? []) as PriceHistoryEntry[]);
        setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.category_sheet, (counts.get(p.category_sheet) ?? 0) + 1);
    return CATEGORY_ORDER.map((c) => ({ name: c, count: counts.get(c) ?? 0 })).sort((a, b) => b.count - a.count);
  }, [products]);
  const maxCount = Math.max(1, ...byCategory.map((c) => c.count));

  const recentPriceChanges = useMemo(() => historyRows.slice(0, 8), [historyRows]);

  // Sản phẩm mới trong tháng — dùng created_at (thêm cho mục đích này), sản
  // phẩm cũ trước khi có cột này sẽ có created_at null nên tự động không lọt
  // vào đây, đúng ý nghĩa "mới thêm" chứ không phải "toàn bộ danh mục".
  const newProductsThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return products
      .filter((p) => p.created_at && new Date(p.created_at) >= monthStart)
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
  }, [products]);

  // Luôn dựng đủ 12 tháng gần nhất (kể cả tháng chưa có thay đổi giá nào =
  // cột rỗng) để trục thời gian nhất quán, không co giãn theo dữ liệu có sẵn.
  const monthlyCounts = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `Th${d.getMonth() + 1}`, count: 0 });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const h of historyRows) {
      const b = byKey.get(h.changed_at.slice(0, 7));
      if (b) b.count++;
    }
    return buckets;
  }, [historyRows]);
  const maxMonthCount = Math.max(1, ...monthlyCounts.map((b) => b.count));

  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.ten_hang_hoa.localeCompare(b.ten_hang_hoa, "vi")), [products]);

  const selectedHistory = useMemo(
    () =>
      historyRows
        .filter((h) => h.product_id === selectedProductId)
        .slice()
        .reverse(), // historyRows đang sắp mới nhất trước — đảo lại để biểu đồ chạy trái sang phải theo thời gian
    [historyRows, selectedProductId]
  );
  const giaBanPoints = useMemo(
    () =>
      selectedHistory
        .filter((h) => h.gia_ban_new != null)
        .map((h) => ({ t: new Date(h.changed_at).getTime(), v: h.gia_ban_new as number })),
    [selectedHistory]
  );
  const giaThungPoints = useMemo(
    () =>
      selectedHistory
        .filter((h) => h.gia_thung_new != null)
        .map((h) => ({ t: new Date(h.changed_at).getTime(), v: h.gia_thung_new as number })),
    [selectedHistory]
  );

  return (
    <div className="app">
      <div className="view-header">
        <div>
          <h1>Báo cáo</h1>
          <p>Tổng quan nhanh về danh mục sản phẩm và tình trạng thay đổi giá.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Tổng sản phẩm</div>
          <div className="value">{products.length}</div>
          <div className="delta">{byCategory.filter((c) => c.count > 0).length} nhóm hàng</div>
        </div>
        <div className="kpi-card">
          <div className="label">Chờ xuất file</div>
          <div className="value accent">{pendingCount}</div>
          <div className="delta warm">cần đồng bộ MISA</div>
        </div>
        <div className="kpi-card">
          <div className="label">Thiếu giá bán lẻ</div>
          <div className="value accent">{missingPrice}</div>
        </div>
      </div>

      <div className="panels">
        <div className="panel">
          <h3>Sản phẩm theo nhóm hàng</h3>
          <div className="panel-scroll">
            {byCategory.map((c) => (
              <div className="bar-row" key={c.name}>
                <div className="cat-name">{c.name}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                </div>
                <div className="n">{c.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Thay đổi giá gần đây</h3>
          <div className="panel-scroll">
            {historyLoading && <p style={{ color: "var(--muted)", fontSize: 12.5 }}>Đang tải...</p>}
            {!historyLoading && recentPriceChanges.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 12.5 }}>Chưa có lịch sử thay đổi giá.</p>
            )}
            {recentPriceChanges.map((h) => {
              const banChanged = h.gia_ban_old !== h.gia_ban_new;
              const thungChanged = h.gia_thung_old !== h.gia_thung_new;
              return (
                <div className="activity-row" key={h.id}>
                  <div className="activity-dot" />
                  <div>
                    {h.product?.ten_hang_hoa ?? "(sản phẩm đã xóa)"}
                    <div className="t">
                      {banChanged && `Giá lẻ ${formatVnd(h.gia_ban_old)}→${formatVnd(h.gia_ban_new)}`}
                      {banChanged && thungChanged && " · "}
                      {thungChanged && `Giá thùng ${formatVnd(h.gia_thung_old)}→${formatVnd(h.gia_thung_new)}`}
                      {" · "}
                      {relativeTimeVi(h.changed_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3>Sản phẩm mới trong tháng</h3>
          <div className="panel-scroll">
            {newProductsThisMonth.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 12.5 }}>Chưa có sản phẩm mới trong tháng này.</p>
            )}
            {newProductsThisMonth.map((p) => (
              <div className="activity-row" key={p.id}>
                <div className="activity-dot" />
                <div>
                  {p.ten_hang_hoa}
                  <div className="t">{relativeTimeVi(p.created_at as string)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-wide">
          <h3>Số lần đổi giá theo tháng</h3>
          <div className="month-chart">
            {monthlyCounts.map((b) => (
              <div className="month-bar" key={b.key} title={`${b.label}: ${b.count} lần`}>
                <div className="month-bar-track">
                  <div className="month-bar-fill" style={{ height: `${(b.count / maxMonthCount) * 100}%` }} />
                </div>
                <div className="month-bar-label">{b.label}</div>
                <div className="month-bar-count">{b.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-wide">
          <h3>Lịch sử giá theo thời gian — chọn sản phẩm</h3>
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ marginBottom: 14, maxWidth: 420 }}>
            <option value="">— Chọn sản phẩm —</option>
            {sortedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ten_hang_hoa}
              </option>
            ))}
          </select>
          {selectedProductId && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div className="stat-kpi-label" style={{ marginBottom: 6 }}>
                  Giá lẻ
                </div>
                <MiniLineChart points={giaBanPoints} color="var(--primary)" />
              </div>
              <div>
                <div className="stat-kpi-label" style={{ marginBottom: 6 }}>
                  Giá thùng
                </div>
                <MiniLineChart points={giaThungPoints} color="var(--warm-ink)" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PRICE_HISTORY_PAGE_SIZE = 100;

function PriceRequestsView({
  requests,
  role,
  reviewingRequestId,
  onReview,
  approvingAll,
  onApproveAll,
  historyRefreshToken,
}: {
  requests: PriceChangeRequest[];
  role: Role;
  reviewingRequestId: string | null;
  onReview: (id: string, action: "approve" | "reject") => void;
  approvingAll: boolean;
  onApproveAll: () => Promise<boolean>;
  historyRefreshToken: number;
}) {
  const canReview = role === "accountant" || role === "admin";
  const pending = useMemo(
    () => [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [requests]
  );
  const pendingCount = pending.length;
  const pendingColCount = canReview ? 9 : 8;

  // "Chờ duyệt" (requests prop) luôn nhỏ nên không cần phân trang — chỉ
  // approved/rejected mới tự phình theo thời gian, nên phần lịch sử tự tải
  // riêng, theo trang, có "Xem thêm".
  const [history, setHistory] = useState<PriceChangeRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(true);

  // Chọn sản phẩm ngay từ lịch sử đã duyệt để xuất báo giá — khỏi phải quay
  // lại Quản lý hàng hóa chọn lại từ đầu. Chọn theo product_id (không phải
  // theo dòng đề xuất) vì 1 sản phẩm có thể có nhiều dòng lịch sử nếu giá đổi
  // nhiều lần — dedupe khi xuất để không in trùng.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportingWord, setExportingWord] = useState(false);

  const approvedProductIds = useMemo(
    () => Array.from(new Set(history.filter((r) => r.status === "approved").map((r) => r.product_id))),
    [history]
  );

  function toggleSelect(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(productId) ? next.delete(productId) : next.add(productId);
      return next;
    });
  }

  function selectAllApproved() {
    setSelected((prev) => new Set([...prev, ...approvedProductIds]));
  }

  async function handleApproveAllAndSelect() {
    const justApproved = pending.map((r) => r.product_id);
    const ok = await onApproveAll();
    if (ok) setSelected((prev) => new Set([...prev, ...justApproved]));
  }

  async function doExportWordBlock() {
    setExportingWord(true);
    try {
      const res = await fetch("/api/admin/export-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
      const blob = await res.blob();
      downloadBlob(blob, "Bang_gia_block_7.7x4cm_Update.docx");

      const now = new Date().toISOString();
      const { error } = await supabase.from("products").update({ last_exported_at: now }).in("id", Array.from(selected));
      if (error) throw error;
      setSelected(new Set());
    } catch (e: any) {
      alert("Xuất file thất bại: " + e.message);
    } finally {
      setExportingWord(false);
    }
  }

  const loadHistoryPage = useCallback(async (offset: number, replace: boolean) => {
    if (replace) setHistoryLoading(true);
    else setHistoryLoadingMore(true);
    const { data, error } = await supabase
      .from("price_change_requests")
      .select(
        "*, product:products(ten_hang_hoa, ma_noi_bo, gia_ban, gia_thung), proposer:profiles!price_change_requests_proposed_by_fkey(display_name, username)"
      )
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .range(offset, offset + PRICE_HISTORY_PAGE_SIZE - 1);
    if (!error) {
      const rows = (data ?? []) as PriceChangeRequest[];
      setHistory((prev) => (replace ? rows : [...prev, ...rows]));
      setHistoryHasMore(rows.length === PRICE_HISTORY_PAGE_SIZE);
    }
    if (replace) setHistoryLoading(false);
    else setHistoryLoadingMore(false);
  }, []);

  useEffect(() => {
    loadHistoryPage(0, true);
  }, [historyRefreshToken, loadHistoryPage]);

  return (
    <div className="app table-page">
      <div className="view-header">
        <div>
          <h1>Chờ duyệt giá</h1>
          <p>{canReview ? "Đề xuất giá từ mọi người, chờ Kế toán/Admin duyệt." : "Đề xuất giá bạn đã gửi và trạng thái xử lý."}</p>
        </div>
        {canReview && pendingCount > 0 && (
          <button className="btn btn-primary" disabled={approvingAll} onClick={handleApproveAllAndSelect}>
            {approvingAll ? "Đang duyệt..." : `Duyệt tất cả (${pendingCount})`}
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Mã sản phẩm</th>
                <th className="num">Giá lẻ cũ</th>
                <th className="num">Giá lẻ mới</th>
                <th className="num">Giá thùng cũ</th>
                <th className="num">Giá thùng mới</th>
                <th>Người đề xuất</th>
                <th>Thời điểm</th>
                {canReview && <th style={{ width: 140 }}></th>}
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={pendingColCount} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Không có đề xuất nào đang chờ.
                  </td>
                </tr>
              )}
              {pending.map((r) => (
                <tr key={r.id}>
                  <td className="col-name">{r.product?.ten_hang_hoa ?? "(sản phẩm đã xóa)"}</td>
                  <td className="code-cell">{r.product?.ma_noi_bo}</td>
                  <td className="num">{formatVnd(r.product?.gia_ban)}</td>
                  <td className="num">{r.proposed_gia_ban != null ? formatVnd(r.proposed_gia_ban) : "—"}</td>
                  <td className="num">{formatVnd(r.product?.gia_thung)}</td>
                  <td className="num">{r.proposed_gia_thung != null ? formatVnd(r.proposed_gia_thung) : "—"}</td>
                  <td>{r.proposer?.display_name ?? r.proposer?.username ?? "—"}</td>
                  <td>{formatDate(r.created_at)}</td>
                  {canReview && (
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-quiet"
                          disabled={reviewingRequestId === r.id}
                          onClick={() => onReview(r.id, "approve")}
                        >
                          Duyệt
                        </button>
                        <button
                          className="btn btn-quiet"
                          disabled={reviewingRequestId === r.id}
                          onClick={() => onReview(r.id, "reject")}
                        >
                          Từ chối
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="view-header" style={{ marginTop: 28 }}>
        <div>
          <h1>Lịch sử duyệt giá</h1>
          <p>Các đề xuất đã được duyệt hoặc từ chối trước đây — chọn sản phẩm đã duyệt để xuất Block giá 7.7x4cm ngay tại đây.</p>
        </div>
        <div className="row-actions">
          {approvedProductIds.length > 0 && (
            <button className="btn btn-neutral" onClick={selectAllApproved}>
              Chọn tất cả đã duyệt ({approvedProductIds.length})
            </button>
          )}
          {selected.size > 0 && (
            <button className="btn btn-danger" onClick={() => setSelected(new Set())}>
              Bỏ chọn
            </button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="selection-bar">
          <span>
            Đã chọn <b>{selected.size}</b> sản phẩm
          </span>
          <button className="btn btn-primary" disabled={exportingWord} onClick={doExportWordBlock}>
            {exportingWord ? "Đang xuất..." : "Block giá 7.7x4cm"}
          </button>
        </div>
      )}

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="col-check"></th>
                <th>Tên sản phẩm</th>
                <th>Mã sản phẩm</th>
                <th className="num">Giá lẻ cũ</th>
                <th className="num">Giá lẻ mới</th>
                <th className="num">Giá thùng cũ</th>
                <th className="num">Giá thùng mới</th>
                <th>Người đề xuất</th>
                <th>Thời điểm</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Đang tải...
                  </td>
                </tr>
              )}
              {!historyLoading && history.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Chưa có lịch sử duyệt giá nào.
                  </td>
                </tr>
              )}
              {history.map((r) => (
                <tr key={r.id}>
                  <td className="col-check">
                    {r.status === "approved" && (
                      <input type="checkbox" checked={selected.has(r.product_id)} onChange={() => toggleSelect(r.product_id)} />
                    )}
                  </td>
                  <td className="col-name">{r.product?.ten_hang_hoa ?? "(sản phẩm đã xóa)"}</td>
                  <td className="code-cell">{r.product?.ma_noi_bo}</td>
                  <td className="num">{formatVnd(r.product?.gia_ban)}</td>
                  <td className="num">{r.proposed_gia_ban != null ? formatVnd(r.proposed_gia_ban) : "—"}</td>
                  <td className="num">{formatVnd(r.product?.gia_thung)}</td>
                  <td className="num">{r.proposed_gia_thung != null ? formatVnd(r.proposed_gia_thung) : "—"}</td>
                  <td>{r.proposer?.display_name ?? r.proposer?.username ?? "—"}</td>
                  <td>{formatDate(r.created_at)}</td>
                  <td>
                    {r.status === "approved" && <span className="pill pill-success">Đã duyệt</span>}
                    {r.status === "rejected" && <span className="pill pill-danger">Đã từ chối</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {historyHasMore && !historyLoading && (
        <div className="pagination-bar">
          <button className="btn btn-quiet" disabled={historyLoadingMore} onClick={() => loadHistoryPage(history.length, false)}>
            {historyLoadingMore ? "Đang tải..." : "Xem thêm"}
          </button>
        </div>
      )}
    </div>
  );
}

function generateTempPassword(): string {
  const specials = "!@#$%^&*";
  const letters = "abcdefghijkmnpqrstuvwxyz";
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  let body = "";
  for (let i = 0; i < 5; i++) body += rand(letters);
  return (
    letters[Math.floor(Math.random() * letters.length)].toUpperCase() +
    body +
    Math.floor(10 + Math.random() * 90) +
    rand(specials)
  );
}

function UserManagementView({ currentUserId }: { currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newRole, setNewRole] = useState<Role>("sales");
  const [tempPassword, setTempPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  async function loadProfiles() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, display_name: displayName, role: newRole, temp_password: tempPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo tài khoản thất bại");
      setUsername("");
      setDisplayName("");
      setTempPassword("");
      setNewRole("sales");
      await loadProfiles();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(p: Profile, role: Role) {
    if (role === p.role) return;
    setChangingRoleId(p.id);
    try {
      const res = await fetch(`/api/admin/users/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đổi vai trò thất bại");
      await loadProfiles();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setChangingRoleId(null);
    }
  }

  async function deleteUser(p: Profile) {
    if (!confirm(`Xóa tài khoản "${p.username ?? p.display_name}"? Không thể hoàn tác.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa tài khoản thất bại");
      await loadProfiles();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_password: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt lại mật khẩu thất bại");
      setResetTarget(null);
      setResetPassword("");
      await loadProfiles();
    } catch (e: any) {
      setResetError(e.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="app table-page">
      <div className="view-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Tạo tài khoản đăng nhập bằng mật khẩu cho nhân sự không dùng Google.</p>
        </div>
      </div>

      <div className="field-group">
        <h3>Tạo tài khoản mới</h3>
        <form className="field-grid" onSubmit={submitCreate}>
          <Field label="Tên đăng nhập">
            <input
              placeholder="vd: hung"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="Tên hiển thị">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Vai trò">
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
              {(["sales", "accountant", "admin", "staff", "shipper"] as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mật khẩu tạm">
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ flex: 1 }}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
              />
              <button type="button" className="btn btn-quiet" onClick={() => setTempPassword(generateTempPassword())}>
                Tạo ngẫu nhiên
              </button>
            </div>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <PasswordChecklist password={tempPassword} />
          </div>
          {createError && (
            <p className="login-error" style={{ gridColumn: "1 / -1" }}>
              {createError}
            </p>
          )}
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Tên hiển thị</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading &&
                profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="name-cell">
                      {p.username ?? p.email}
                      {!p.username && <span className="sub">Google</span>}
                    </td>
                    <td>{p.display_name ?? "—"}</td>
                    <td>
                      {p.id === currentUserId ? (
                        ROLE_LABEL[p.role ?? "admin"]
                      ) : (
                        <select
                          value={p.role ?? ""}
                          disabled={changingRoleId === p.id}
                          onChange={(e) => changeRole(p, e.target.value as Role)}
                        >
                          {!p.role && <option value="">Chưa cấp quyền</option>}
                          {(["sales", "accountant", "admin", "staff", "shipper"] as Role[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>{p.must_change_password ? "Cần đổi mật khẩu" : "—"}</td>
                    <td>
                      <div className="row-actions">
                        {p.username && (
                          <button className="btn btn-quiet" onClick={() => setResetTarget(p)}>
                            Đặt lại mật khẩu
                          </button>
                        )}
                        {p.id !== currentUserId && (
                          <button className="icon-btn danger" title="Xóa tài khoản" aria-label="Xóa tài khoản" onClick={() => deleteUser(p)}>
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {resetTarget && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setResetTarget(null)}>
          <div className="modal">
            <h2>Đặt lại mật khẩu</h2>
            <p className="modal-sub">{resetTarget.username}</p>
            <form onSubmit={submitReset}>
              <div className="field-group">
                <Field label="Mật khẩu tạm mới">
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={{ flex: 1 }}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                    <button type="button" className="btn btn-quiet" onClick={() => setResetPassword(generateTempPassword())}>
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                </Field>
                <PasswordChecklist password={resetPassword} />
                {resetError && <p className="login-error">{resetError}</p>}
              </div>
              <div className="modal-actions">
                <button className="btn" type="button" onClick={() => setResetTarget(null)}>
                  Hủy
                </button>
                <button className="btn btn-primary" type="submit" disabled={resetting}>
                  {resetting ? "Đang lưu..." : "Đặt lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ACTIVITY_PAGE_SIZE = 100;

function ActivityLogView({ role }: { role: Role }) {
  const [view, setView] = useState<"all" | "price">("all");
  const [expanded, setExpanded] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportingPriceHistory, setExportingPriceHistory] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Mỗi tab tự tải + phân trang riêng, thay vì lọc "Lịch sử giá" ra từ 1 danh
  // sách "Tất cả hoạt động" giới hạn cứng 200 dòng như trước — cách cũ khiến
  // các lần duyệt giá cũ hơn dễ bị "đẩy văng" khỏi cửa sổ 200 dòng nếu gần đây
  // có nhiều hoạt động khác (sửa sản phẩm...) chen vào.
  const [allEntries, setAllEntries] = useState<ActivityLogEntry[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allLoadingMore, setAllLoadingMore] = useState(false);
  const [allHasMore, setAllHasMore] = useState(true);

  const [priceEntries, setPriceEntries] = useState<ActivityLogEntry[]>([]);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceLoadingMore, setPriceLoadingMore] = useState(false);
  const [priceHasMore, setPriceHasMore] = useState(true);

  const loadAllPage = useCallback(async (offset: number, replace: boolean) => {
    if (replace) setAllLoading(true);
    else setAllLoadingMore(true);
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + ACTIVITY_PAGE_SIZE - 1);
    if (!error) {
      const rows = (data as ActivityLogEntry[]) ?? [];
      setAllEntries((prev) => (replace ? rows : [...prev, ...rows]));
      setAllHasMore(rows.length === ACTIVITY_PAGE_SIZE);
    }
    if (replace) setAllLoading(false);
    else setAllLoadingMore(false);
  }, []);

  // "Lịch sử giá" lấy cả 2 nguồn ghi giá thật vào products: duyệt đề xuất
  // (price_request.approve, 1 dòng = 1 sản phẩm) VÀ nhập Excel hàng loạt
  // (product.import, 1 dòng có thể gồm NHIỀU sản phẩm đổi giá cùng lúc — coi
  // priceDisplayRows bên dưới, nơi "bung" từng sản phẩm ra 1 dòng hiển thị
  // riêng). Trước đây chỉ lấy price_request.approve, khiến giá đổi do nhập
  // Excel bị lọt mất khỏi tab này dù đã ghi đúng trong DB.
  const loadPricePage = useCallback(async (offset: number, replace: boolean) => {
    if (replace) setPriceLoading(true);
    else setPriceLoadingMore(true);
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .in("action", ["price_request.approve", "product.import"])
      .order("created_at", { ascending: false })
      .range(offset, offset + ACTIVITY_PAGE_SIZE - 1);
    if (!error) {
      const rows = (data as ActivityLogEntry[]) ?? [];
      setPriceEntries((prev) => (replace ? rows : [...prev, ...rows]));
      setPriceHasMore(rows.length === ACTIVITY_PAGE_SIZE);
    }
    if (replace) setPriceLoading(false);
    else setPriceLoadingMore(false);
  }, []);

  useEffect(() => {
    loadAllPage(0, true);
    loadPricePage(0, true);
  }, [loadAllPage, loadPricePage]);

  // Bung mỗi dòng activity_log thành 1+ dòng hiển thị: price_request.approve
  // đã là 1 sản phẩm/dòng sẵn; product.import có thể gồm nhiều sản phẩm đổi
  // giá trong 1 lần nhập, tách riêng từng sản phẩm ra 1 dòng để hiển thị
  // đúng mức "1 dòng = 1 lần đổi giá 1 sản phẩm" nhất quán trong cả bảng.
  type PriceDisplayRow = {
    key: string;
    targetLabel: string;
    giaBanOld: number | null;
    giaBanNew: number | null;
    giaThungOld: number | null;
    giaThungNew: number | null;
    proposedByName: string | null;
    actorName: string | null;
    createdAt: string;
    source: "approve" | "import";
  };
  const priceDisplayRows = useMemo(() => {
    const out: PriceDisplayRow[] = [];
    for (const e of priceEntries) {
      if (e.action === "product.import") {
        const detail = e.detail as { priceChanges?: { items?: Record<string, unknown>[] } } | null;
        const items = detail?.priceChanges?.items ?? [];
        items.forEach((item, i) => {
          out.push({
            key: `${e.id}-${i}`,
            targetLabel: (item.ten_hang_hoa as string) || (item.ma_noi_bo as string) || "—",
            giaBanOld: item.gia_ban_cu as number | null,
            giaBanNew: item.gia_ban_moi as number | null,
            giaThungOld: item.gia_thung_cu as number | null,
            giaThungNew: item.gia_thung_moi as number | null,
            proposedByName: null,
            actorName: e.actor_name,
            createdAt: e.created_at,
            source: "import",
          });
        });
      } else {
        const d = (e.detail ?? {}) as Record<string, number | string | null>;
        out.push({
          key: e.id,
          targetLabel: e.target_label ?? "—",
          giaBanOld: d.gia_ban_old as number | null,
          giaBanNew: d.gia_ban_new as number | null,
          giaThungOld: d.gia_thung_old as number | null,
          giaThungNew: d.gia_thung_new as number | null,
          proposedByName: (d.proposed_by_name as string) ?? null,
          actorName: e.actor_name,
          createdAt: e.created_at,
          source: "approve",
        });
      }
    }
    return out;
  }, [priceEntries]);

  const priceColCount = expanded ? 9 : 7;

  // Lấy từ bảng lịch sử giá gốc (price_history) — đầy đủ mọi lần đổi giá,
  // không chỉ các lần duyệt đề xuất như bảng đang hiển thị trên tab này.
  async function doExportPriceHistory() {
    setExportingPriceHistory(true);
    try {
      const res = await fetch("/api/admin/export-price-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: exportFrom || undefined, to: exportTo || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (await res.text()));
      }
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10).split("-").reverse().join("-");
      const suffix = exportFrom || exportTo ? ` (${exportFrom || "..."} - ${exportTo || "..."})` : "";
      downloadBlob(blob, `Lich_su_gia_${today}${suffix}.xlsx`);
    } catch (e: any) {
      alert("Xuất Excel thất bại: " + e.message);
    } finally {
      setExportingPriceHistory(false);
    }
  }

  // Xuất trước, xóa sau — chỉ xóa khi file lưu trữ đã tải về thành công VÀ
  // Admin xác nhận lần cuối biết chính xác số dòng sẽ mất. Không có cơ chế
  // tự động chạy ngầm định kỳ.
  async function doCleanupOldPriceHistory() {
    setCleaningUp(true);
    try {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const cutoffIso = cutoff.toISOString();

      const res = await fetch("/api/admin/export-price-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: cutoffIso }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (await res.text()));
      }
      const rowCount = Number(res.headers.get("X-Row-Count") ?? "0");
      if (rowCount === 0) {
        alert("Không có dòng lịch sử giá nào cũ hơn 1 năm — không cần dọn.");
        return;
      }
      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10).split("-").reverse().join("-");
      downloadBlob(blob, `Lich_su_gia_luu_tru_truoc_${today}.xlsx`);

      if (!confirm(`Đã tải xong file lưu trữ (${rowCount} dòng). Xóa ${rowCount} dòng lịch sử giá cũ hơn 1 năm khỏi hệ thống?`)) {
        return;
      }

      const delRes = await fetch("/api/admin/price-history/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: cutoffIso }),
      });
      if (!delRes.ok) {
        const data = await delRes.json().catch(() => null);
        throw new Error(data?.error || (await delRes.text()));
      }
      const { deletedCount } = await delRes.json();
      alert(`Đã xóa ${deletedCount} dòng lịch sử giá cũ hơn 1 năm.`);
    } catch (e: any) {
      alert("Dọn dữ liệu thất bại: " + e.message);
    } finally {
      setCleaningUp(false);
    }
  }

  return (
    <div className="app table-page">
      <div className="view-header">
        <div>
          <h1>Nhật ký hoạt động</h1>
          <p>Toàn bộ thao tác quan trọng — ai làm gì, lúc nào. Mọi người đã đăng nhập đều xem được.</p>
        </div>
      </div>

      <Segmented
        style={{ marginBottom: 14 }}
        items={[
          { key: "all", label: "Tất cả hoạt động", active: view === "all", onClick: () => setView("all") },
          {
            key: "price",
            label: `Lịch sử giá (${priceDisplayRows.length}${priceHasMore ? "+" : ""})`,
            active: view === "price",
            onClick: () => setView("price"),
          },
        ]}
      />

      {view === "all" && (
        <>
          <div className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Người thực hiện</th>
                    <th>Hành động</th>
                    <th>Đối tượng</th>
                    <th>Thời điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {allLoading && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Đang tải...
                      </td>
                    </tr>
                  )}
                  {!allLoading && allEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Chưa có hoạt động nào.
                      </td>
                    </tr>
                  )}
                  {allEntries.map((e) => (
                    <tr key={e.id}>
                      <td>{e.actor_name ?? "—"}</td>
                      <td>{ACTION_LABELS[e.action] ?? e.action}</td>
                      <td>{e.target_label ?? "—"}</td>
                      <td>{formatDate(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {allHasMore && !allLoading && (
            <div className="pagination-bar">
              <button className="btn btn-quiet" disabled={allLoadingMore} onClick={() => loadAllPage(allEntries.length, false)}>
                {allLoadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}

      {view === "price" && (
        <>
          <div className="view-row" style={{ marginTop: 0, justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} title="Từ ngày" />
              <span style={{ color: "var(--muted)" }}>–</span>
              <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} title="Đến ngày" />
              <button className="btn btn-quiet" disabled={exportingPriceHistory} onClick={doExportPriceHistory}>
                {exportingPriceHistory ? "Đang xuất..." : "Xuất Excel"}
              </button>
              {role === "admin" && (
                <button className="btn btn-quiet" disabled={cleaningUp} onClick={doCleanupOldPriceHistory}>
                  {cleaningUp ? "Đang xử lý..." : "Xuất & dọn dữ liệu cũ hơn 1 năm"}
                </button>
              )}
            </div>
            <button className="btn btn-quiet" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Thu gọn" : "Mở rộng"}
            </button>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12.5, margin: "0 0 10px" }}>
            Gồm cả các lần duyệt đề xuất giá lẫn nhập Excel hàng loạt. File Excel xuất ra vẫn đầy đủ nhất (thêm cả các lần đồng bộ tự động từ Google Sheet — không có người thao tác nên không hiện ở đây).
          </p>
          <div className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th className="num">Giá lẻ cũ</th>
                    <th className="num">Giá lẻ mới</th>
                    <th className="num">Giá thùng cũ</th>
                    <th className="num">Giá thùng mới</th>
                    <th>Nguồn</th>
                    {expanded && <th>Người đề xuất</th>}
                    {expanded && <th>Người thực hiện</th>}
                    <th>Thời điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {priceLoading && (
                    <tr>
                      <td colSpan={priceColCount} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Đang tải...
                      </td>
                    </tr>
                  )}
                  {!priceLoading && priceDisplayRows.length === 0 && (
                    <tr>
                      <td colSpan={priceColCount} style={{ textAlign: "center", color: "var(--muted)" }}>
                        Chưa có lịch sử giá nào.
                      </td>
                    </tr>
                  )}
                  {priceDisplayRows.map((r) => (
                    <tr key={r.key}>
                      <td className="col-name">{r.targetLabel}</td>
                      <td className="num">{formatVnd(r.giaBanOld)}</td>
                      <td className="num">{formatVnd(r.giaBanNew)}</td>
                      <td className="num">{formatVnd(r.giaThungOld)}</td>
                      <td className="num">{formatVnd(r.giaThungNew)}</td>
                      <td>
                        <span className={`pill ${r.source === "import" ? "pill-warm" : "pill-primary"}`}>
                          <span className="dot" />
                          {r.source === "import" ? "Nhập Excel" : "Duyệt đề xuất"}
                        </span>
                      </td>
                      {expanded && <td>{r.proposedByName ?? "—"}</td>}
                      {expanded && <td>{r.actorName ?? "—"}</td>}
                      <td>{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {priceHasMore && !priceLoading && (
            <div className="pagination-bar">
              <button className="btn btn-quiet" disabled={priceLoadingMore} onClick={() => loadPricePage(priceEntries.length, false)}>
                {priceLoadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InventoryView() {
  return (
    <div className="app">
      <div className="view-header">
        <div>
          <h1>Quản lý tồn kho</h1>
          <p>Theo dõi tồn đầu kỳ / nhập / xuất / tồn cuối kỳ theo từng sản phẩm.</p>
        </div>
      </div>
      <div className="empty-state" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
        Chưa có dữ liệu tồn kho trong hệ thống.
        <br />
        Các file MISA xuất-nhập-tồn bạn đang dùng có sẵn cột &quot;Đầu kỳ / Nhập kho / Xuất kho / Cuối kỳ&quot;, nhưng
        database hiện chưa lưu các cột này — cần bổ sung trước khi mục này hiển thị được số liệu thật.
      </div>
    </div>
  );
}

function LogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}
function TagPercentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13v-3a2 2 0 0 1 2-2h4l7.59 7.59a2 2 0 0 1 0 2.82Z" />
      <path d="m9 8-4 8" />
      <circle cx="6.5" cy="9.5" r="0.75" fill="currentColor" />
      <circle cx="10.5" cy="14.5" r="0.75" fill="currentColor" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function ArchiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="5" rx="1.2" />
      <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M10 13h4" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 15v3" />
      <path d="M12 10v8" />
      <path d="M17 6v12" />
    </svg>
  );
}
