// Icon SVG dùng chung giữa ≥2 view admin (khác với icon chỉ 1 view dùng, vẫn
// định nghĩa cục bộ ngay trong file đó — xem docs/component-conventions.md).
export function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

// Icon menu/nav dùng chung giữa Sidebar (HomeClient.tsx) và SaleClient.tsx.
export function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}
export function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13v-3a2 2 0 0 1 2-2h4l7.59 7.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7.5" cy="9.5" r="1" />
      <path d="M13 21 21.03 12.97" />
    </svg>
  );
}
export function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
export function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}
// Chỉ SaleClient.tsx dùng hiện tại (mục "Chat khách hàng" — placeholder chưa
// có chức năng) nhưng đặt ở đây sẵn vì Tin nhắn nội bộ (chưa xây) sẽ cần lại.
export function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}
