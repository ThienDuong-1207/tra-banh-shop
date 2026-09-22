import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/admin/supabaseServerClient";
import HomeClient, { Role } from "./HomeClient";

export default async function Page() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, must_change_password")
    .eq("id", user.id)
    .single();

  if (profile?.must_change_password) redirect("/admin/set-password");

  // Shipper dùng trang riêng, tối giản, tối ưu điện thoại — không vào được
  // khung admin đầy đủ (bảng sản phẩm/giá không liên quan tới công việc,
  // RLS cũng đã chặn ở tầng dữ liệu, đây chỉ là điều hướng đúng chỗ).
  if (profile?.role === "shipper") redirect("/admin/shipper");

  if (!profile?.role) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 19, margin: 0 }}>Tài khoản chưa được cấp quyền</h1>
        <p style={{ color: "var(--muted)", maxWidth: 360 }}>
          Liên hệ Admin để được cấp quyền truy cập cho tài khoản <b>{user.email}</b>.
        </p>
      </div>
    );
  }

  return <HomeClient displayName={profile.display_name || user.email || ""} role={profile.role as Role} userId={user.id} />;
}
