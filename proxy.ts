import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Ngược logic với middleware cũ của trabanh: mặc định app này PUBLIC (đúng
// bản chất storefront công khai của tra-banh-shop). Middleware chỉ can
// thiệp — và chỉ tạo Supabase client — cho các path bắt đầu bằng "/admin"
// (page) hoặc "/api/admin" (route handler). Mọi path khác (trang chủ,
// /san-pham, /gio-hang, /thanh-toan...) bỏ qua hoàn toàn, không có overhead.
const ADMIN_PAGE_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

// Trong khu vực /admin, các path này vẫn phải public (không yêu cầu đăng
// nhập) vì chính chúng LÀ luồng đăng nhập / đặt mật khẩu lần đầu.
const ADMIN_PUBLIC_PAGE_PATHS = ["/admin/login", "/admin/auth/callback", "/admin/set-password"];

// Được gọi bởi GitHub Actions workflow (sync-sheet.yml) mỗi giờ bằng
// SYNC_SECRET riêng của nó (kiểm tra trong app/api/admin/sync-sheet/route.ts)
// — không có session đăng nhập, nên phải luôn reachable không qua middleware.
const ADMIN_PUBLIC_API_PATHS = ["/api/admin/sync-sheet"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminPage = path.startsWith(ADMIN_PAGE_PREFIX) && !path.startsWith(ADMIN_API_PREFIX);
  const isAdminApi = path.startsWith(ADMIN_API_PREFIX);

  // Không phải /admin hoặc /api/admin -> public, thoát ngay, không đụng tới
  // Supabase/cookies.
  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const isPublicAdminPage = ADMIN_PUBLIC_PAGE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const isPublicAdminApi = ADMIN_PUBLIC_API_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (isPublicAdminPage || isPublicAdminApi) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        req.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: req });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        req.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: req });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Cũng refresh cookie session nếu sắp hết hạn.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return response;
}

export const config = {
  // Chỉ chạy middleware cho các path có thể là /admin hoặc /api/admin — mọi
  // request khác (trang shop công khai, static assets...) không qua matcher
  // này nên middleware không hề chạy, đúng yêu cầu "không có overhead".
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
