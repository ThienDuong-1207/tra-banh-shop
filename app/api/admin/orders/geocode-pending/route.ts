import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin/supabaseServer";
import { getCurrentUserRole } from "@/lib/admin/authz";
import { matchAddressToWard } from "@/lib/admin/geocodeAddress";

export const runtime = "nodejs";

// Geocode "đơn giản" (tâm phường/xã, xem lib/admin/geocodeAddress.ts) cho
// những đơn CHƯA có lat/lng — phục vụ tính năng gom tuyến giao hàng ở trang
// Shipper (xem components/admin/ShipperClient.tsx, gọi route này mỗi khi
// tải lại danh sách đơn). Dùng supabaseAdmin() (service-role, bỏ qua RLS) vì
// RLS UPDATE của role shipper chỉ cho phép sửa đơn ĐÃ nhận của chính mình
// (supabase/migrations/007b_shipper_and_status_history.sql) — geocode đơn
// "Đang xử lý" chưa ai nhận là việc hệ thống làm nền, không phải shipper tự
// sửa đơn của người khác.
export async function POST() {
  const current = await getCurrentUserRole();
  if (!current) return NextResponse.json({ error: "Chưa đăng nhập hoặc chưa được cấp quyền" }, { status: 401 });

  const supabase = supabaseAdmin();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_address")
    .is("lat", null)
    .not("customer_address", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  for (const o of orders ?? []) {
    const match = matchAddressToWard(o.customer_address as string);
    if (!match) continue;
    const { error: updateError } = await supabase
      .from("orders")
      .update({ lat: match.lat, lng: match.lng, geocoded_ward: `${match.ward}, ${match.province}` })
      .eq("id", o.id);
    if (!updateError) updated++;
  }

  return NextResponse.json({ checked: orders?.length ?? 0, updated });
}
