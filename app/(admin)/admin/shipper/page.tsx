import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/admin/supabaseServerClient";
import ShipperClient from "@/components/admin/ShipperClient";

export default async function ShipperPage() {
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
  // shipper dùng trang này làm trang chính. Admin được PHÉP ghé qua để dùng
  // thử chức năng giao hàng (nav "Trang nhân viên" ở HomeClient), có nút
  // "Quay lại trang Admin" trong ShipperClient. Role khác (kể cả chưa cấp
  // quyền) về đúng khung admin thường, trang đó tự xử lý các trường hợp còn
  // lại.
  if (profile?.role !== "shipper" && profile?.role !== "admin") redirect("/admin");

  return <ShipperClient displayName={profile.display_name || user.email || ""} userId={user.id} role={profile.role} />;
}
