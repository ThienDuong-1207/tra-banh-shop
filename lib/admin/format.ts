// Định dạng tiền/ngày dùng chung phía admin — tách ra từ HomeClient.tsx vì
// đã dùng ở ≥2 nơi (nhiều view trong HomeClient) và giờ cần dùng thêm ở
// OrdersView (components/admin/), tránh định nghĩa lại.
export function formatVnd(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : v.toLocaleString("vi-VN");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
