"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/admin/supabaseClient";
import { relativeTimeVi } from "@/lib/admin/format";
import type { Notification } from "@/lib/admin/types";

// Chuông thông báo trên topbar — dùng chung cho khung admin đầy đủ
// (HomeClient.tsx) và khung /admin/sale (SaleClient.tsx). `onNavigate` nhận
// chuỗi thô (không ràng buộc kiểu `View` cụ thể của từng khung) để component
// này độc lập với danh sách view của nơi gọi — nơi gọi tự ép kiểu theo View
// của chính mình.
export default function NotificationBell({ userId, onNavigate }: { userId: string; onNavigate: (v: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled) setNotifications((data as Notification[]) ?? []);
    }
    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markRead(n: Notification) {
    if (!n.read_at) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link_view) onNavigate(n.link_view);
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.from("notifications").update({ read_at: now }).eq("recipient_id", userId).is("read_at", null);
  }

  return (
    <div className="notification-bell">
      <button className="notification-bell-trigger" onClick={() => setOpen((v) => !v)} aria-label="Thông báo">
        <BellIcon />
        {unreadCount > 0 && <span className="pill pill-danger badge notification-badge">{unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="notification-backdrop" onClick={() => setOpen(false)} />
          <div className="notification-panel">
            <div className="notification-panel-head">
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <button className="btn btn-quiet" onClick={markAllRead}>
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 && <div className="notification-empty">Chưa có thông báo nào.</div>}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`notification-item${n.read_at ? "" : " unread"}`}
                  onClick={() => markRead(n)}
                >
                  <div className="notification-message">{n.message}</div>
                  <div className="notification-time">{relativeTimeVi(n.created_at)}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
