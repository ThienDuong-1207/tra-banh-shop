// Icon SVG dùng chung giữa ≥2 view admin (khác với icon chỉ 1 view dùng, vẫn
// định nghĩa cục bộ ngay trong file đó — xem docs/component-conventions.md).
export function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
