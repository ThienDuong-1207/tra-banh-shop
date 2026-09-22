"use client";

import { useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import type { Role } from "@/lib/admin/types";
import { MenuIcon, TagIcon, ReceiptIcon, UsersIcon, ChatIcon } from "@/components/admin/icons";
import NotificationBell from "@/components/admin/NotificationBell";
import ProductsView from "@/components/admin/ProductsView";
import OrdersView from "@/components/admin/OrdersView";
import CustomersView from "@/components/admin/CustomersView";

type SaleView = "hanghoa" | "donhang" | "khachhang";

const ROLE_LABEL: Record<Role, string> = {
  sales: "Sales",
  accountant: "Kế toán",
  admin: "Admin",
  staff: "Nhân viên",
  shipper: "Shipper",
};

// Khung riêng cho staff/sales (route /admin/sale, xem
// app/(admin)/admin/sale/page.tsx) — chỉ gồm đúng 3 chức năng nav yêu cầu
// (Quản lý hàng hóa/Đơn hàng/Khách hàng) + 1 mục "Chat khách hàng" placeholder
// chưa có chức năng thật (Tin nhắn nội bộ chưa được xây ở dự án này). Dùng
// lại đúng khung `.shell`/`.sidebar`/`.main`/`.topbar` của
// app/(admin)/globals.css (không tự vẽ CSS riêng như ShipperClient — trang
// này cần trải nghiệm bảng dữ liệu đầy đủ trên desktop, không phải tối giản
// mobile-only như shipper) và tái sử dụng nguyên khối `ProductsView`/
// `OrdersView`/`CustomersView` đã tách ra ở app/(admin)/admin/HomeClient.tsx —
// không copy code.
export default function SaleClient({ displayName, role, userId }: { displayName: string; role: Role; userId: string }) {
  const [activeView, setActiveView] = useState<SaleView>("hanghoa");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/admin/login");
  }

  function go(v: SaleView) {
    setActiveView(v);
    setMobileNavOpen(false);
  }

  return (
    <div className="shell">
      <nav className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`}>
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/templates/logo.png" alt="Trà & Bánh" />
          <div className="brand-text-under">Bán hàng</div>
          <button
            className="sidebar-mobile-toggle"
            aria-label={mobileNavOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
        </div>
        {mobileNavOpen && <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />}
        <div className="nav">
          <div className="nav-label">Menu</div>
          <button className={`nav-item${activeView === "hanghoa" ? " active" : ""}`} onClick={() => go("hanghoa")}>
            <TagIcon />
            Quản lý hàng hóa
          </button>
          <button className={`nav-item${activeView === "donhang" ? " active" : ""}`} onClick={() => go("donhang")}>
            <ReceiptIcon />
            Đơn hàng
          </button>
          <button className={`nav-item${activeView === "khachhang" ? " active" : ""}`} onClick={() => go("khachhang")}>
            <UsersIcon />
            Khách hàng
          </button>
          <button className="nav-item" disabled title="Chưa xây dựng — sẽ có trong bản cập nhật sau">
            <ChatIcon />
            Chat khách hàng
            <span className="pill pill-warm badge">Sắp có</span>
          </button>
        </div>
        <div className="sidebar-foot sidebar-account">
          <div className="sidebar-account-name">{displayName}</div>
          <div className="sidebar-account-role">{ROLE_LABEL[role]}</div>
          <button className="btn btn-quiet sidebar-signout" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </nav>
      <main className="main">
        <div className="topbar">
          <NotificationBell userId={userId} onNavigate={(v) => go(v as SaleView)} />
          <div className="topbar-avatar" title={displayName}>
            {(displayName.trim()[0] ?? "?").toUpperCase()}
          </div>
        </div>
        <div className="main-content">
          {activeView === "hanghoa" && <ProductsView role={role} />}
          {activeView === "donhang" && <OrdersView userId={userId} />}
          {activeView === "khachhang" && <CustomersView />}
        </div>
      </main>
    </div>
  );
}
