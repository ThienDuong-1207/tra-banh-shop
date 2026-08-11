import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin/supabaseServer";
import { buildBrandExport } from "@/lib/admin/brandExportBuilder";
import { Product } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from("products").select("*, brand:brands(name)");
    if (error) throw error;

    const buf = await buildBrandExport(data as Product[]);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Danh_sach_theo_thuong_hieu.xlsx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
