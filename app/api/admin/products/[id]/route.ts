import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin/supabaseServer";
import { resolveBrandId } from "@/lib/admin/brands";
import { friendlyDbError } from "@/lib/admin/dbErrors";
import { ProductInput } from "@/lib/admin/types";
import { getCurrentUserRole } from "@/lib/admin/authz";
import { logActivity } from "@/lib/admin/activityLog";

export const runtime = "nodejs";

// Form "Sửa sản phẩm" đầy đủ — giờ chỉ Admin dùng (Kế toán chỉ còn sửa được
// đúng "Tên trên hóa đơn", làm qua PATCH /api/products/[id]/field inline
// ngay trong bảng, không cần mở form này nữa).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUserRole();
  if (!current) return NextResponse.json({ error: "Chưa đăng nhập hoặc chưa được cấp quyền" }, { status: 401 });
  if (current.role !== "admin") {
    return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
  }

  try {
    const { brand, ...fields } = (await req.json()) as ProductInput;

    const supabase = supabaseAdmin();
    const brand_id = await resolveBrandId(supabase, brand);

    const { data, error } = await supabase
      .from("products")
      .update({ ...fields, brand_id })
      .eq("id", id)
      .select("*, brand:brands(name)")
      .single();
    if (error) throw new Error(friendlyDbError(error) ?? error.message);

    await logActivity({
      actorId: current.userId,
      actorName: current.displayName,
      action: "product.update",
      targetType: "product",
      targetId: id,
      targetLabel: data.ten_hang_hoa,
      detail: fields,
    });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUserRole();
  if (!current) return NextResponse.json({ error: "Chưa đăng nhập hoặc chưa được cấp quyền" }, { status: 401 });
  if (current.role !== "admin") {
    return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: existing } = await supabase.from("products").select("ten_hang_hoa").eq("id", id).single();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    await logActivity({
      actorId: current.userId,
      actorName: current.displayName,
      action: "product.delete",
      targetType: "product",
      targetId: id,
      targetLabel: existing?.ten_hang_hoa ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
