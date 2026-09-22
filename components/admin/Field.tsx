// Nhãn + ô nhập dùng chung cho mọi form admin (Quản lý hàng hóa, Quản lý
// người dùng...) — tách ra đây (thay vì định nghĩa cục bộ trong từng file)
// vì đã dùng ở ≥2 view.
export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
