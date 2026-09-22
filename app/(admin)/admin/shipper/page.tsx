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
  // Không phải shipper (kể cả chưa cấp quyền) → về đúng khung admin thường,
  // trang đó tự xử lý các trường hợp còn lại (chưa cấp quyền, role khác...).
  if (profile?.role !== "shipper") redirect("/admin");

  return <ShipperClient displayName={profile.display_name || user.email || ""} userId={user.id} />;
}
