import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/admin/supabaseServerClient";
import SaleClient from "@/components/admin/SaleClient";

export default async function SalePage() {
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
  // Chỉ staff/sales dùng khung rút gọn này — role khác (kể cả chưa cấp
  // quyền) về đúng khung admin thường, trang đó tự xử lý các trường hợp còn
  // lại (chưa cấp quyền, shipper...).
  if (profile?.role !== "staff" && profile?.role !== "sales") redirect("/admin");

  return <SaleClient displayName={profile.display_name || user.email || ""} role={profile.role} userId={user.id} />;
}
