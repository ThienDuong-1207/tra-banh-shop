# Quy ước tái sử dụng component & hàm dùng chung

File này bắt buộc phải đọc trước khi thêm/sửa bất kỳ UI nào trong repo này (cả `/` lẫn `/admin`). Mục tiêu: **mọi mảnh UI hoặc logic lặp lại phải nằm ở một nơi duy nhất, được gọi bằng tên** — không copy-paste, không mỗi trang tự tạo một bản JSX/hàm tương tự.

## Quy trình bắt buộc trước khi viết code UI mới

Thực hiện đúng thứ tự, không bỏ qua bước nào:

1. **Grep trước khi viết.** Trước khi tạo bất kỳ component, class Tailwind lặp lại, hay hàm tiện ích nào, tìm xem đã có chưa:
   - `grep -rn "<tên tương tự>" components/ lib/` hoặc đọc "Kho hiện có" bên dưới.
   - Nếu đã có thứ làm gần đúng việc cần: **mở rộng nó qua props**, không tạo bản sao.
   - Nếu chưa có nhưng logic/UI này rõ ràng sẽ lặp lại (xuất hiện ≥2 nơi, hoặc là pattern chuẩn như nút, badge, form field...): tạo **một** component/hàm dùng chung, đặt đúng thư mục theo bảng dưới.
   - Nếu chỉ dùng đúng 1 lần, không có dấu hiệu lặp lại: được phép viết inline ngay trong page, không bắt buộc tách file.
2. **Không hardcode token đã có sẵn.** Màu sắc, khoảng cách, radius phải lấy từ token khai báo trong `app/globals.css` (`@theme` block: `--color-primary`, `--color-accent`, `--color-cta`, `--color-cream`, `--color-surface`, `--color-surface-alt`, `--color-ink`, `--color-muted`, `--color-promo-a/b/c/d`...) qua class Tailwind tương ứng (`bg-primary`, `text-ink`...). `--color-surface` là nền trang mặc định (không còn `--color-cream` — token đó giờ chỉ dùng làm màu chữ/nền trên khối màu tối như `bg-primary`/`bg-footer`). `--color-surface-alt` thay cho `--color-warm-beige`/`--color-peach`/`--color-cream-yellow` cũ (đã bỏ) ở chip/panel phụ. `--color-cta` (xanh lá lime, theo đúng layout Gromuse gốc — xem PRODUCT.md) là màu **duy nhất** cho nút hành động chính (mua ngay, thêm giỏ, stepper +/-, "Shop now"-style CTA) — `--color-accent` (vàng gold) không còn dùng cho nút CTA nữa, chỉ còn vai trò phụ/badge. `--color-promo-a/b/c/d` chỉ dùng cho dải 4 thẻ khuyến mãi trang chủ (khối trang trí độc lập). Không viết `#6b1420` hay `style={{ color: "..." }}` trực tiếp trong component trừ khi giá trị đó thực sự chỉ dùng đúng 1 chỗ và không mang tính hệ thống.
3. **Sau khi thêm/xóa/đổi tên một component hoặc hàm dùng chung** ở `components/`, `components/admin/`, `lib/`, `lib/admin/`: cập nhật ngay bảng "Kho hiện có" bên dưới trong cùng lần sửa — không để bảng lệch với code thật.

## Quy ước thư mục

| Thư mục | Dùng cho | Không được |
|---|---|---|
| `components/` | Component UI dùng chung cho các trang **public** (`/`, `/san-pham`, `/gio-hang`, `/thanh-toan`...) | Không đặt component chỉ admin dùng ở đây |
| `components/admin/` | Component UI dùng chung cho các trang **`/admin/*`** | Không đặt component public ở đây |
| `lib/` | Hàm tiện ích / gọi Supabase phía **public** (format tiền, giỏ hàng, danh mục...) | Không import trong code admin |
| `lib/admin/` | Hàm tiện ích / builder xuất file / gọi Supabase phía **admin** | Không import trong code public — một số file ở đây dùng `SUPABASE_SERVICE_ROLE_KEY`, tuyệt đối không kéo vào Client Component hay bundle public |
| `app/(site)/**/page.tsx`, `app/(admin)/**/page.tsx` | Chỉ **lắp ráp** các component/hàm dùng chung nói trên theo bố cục riêng của từng trang | Không định nghĩa lại một component đã có sẵn ngay trong file page |
| `app/globals.css` | Design token (`@theme`) + style toàn cục cho route group `(site)` (import qua `app/(site)/layout.tsx`) — `(admin)` dùng file token riêng `app/(admin)/globals.css`, không chung | Component-level style nên ưu tiên Tailwind utility, không thêm class CSS mới trừ khi Tailwind không đáp ứng được |

## Kho hiện có (cập nhật liên tục — đây là nguồn sự thật, không phải code)

### Component public (`components/*.tsx`)

| Component | Việc gì |
|---|---|
| `Header` | Thanh điều hướng trên cùng, mọi trang public — bố cục theo layout Gromuse (xem PRODUCT.md): hamburger (mobile, `"use client"`, mở panel nav đơn giản) + logo trái, ô tìm kiếm pill giữa (submit GET tới `/san-pham?q=`, ẩn dưới `sm`, có bản rút gọn trong panel mobile), Zalo/hotline + `CartBadge` phải |
| `Footer` | Chân trang, mọi trang public |
| `ProductCard` | Thẻ hiển thị 1 sản phẩm trong danh sách/lưới — ảnh chất liệu theo danh mục (qua `getCategoryImage`, không còn emoji placeholder), tên + subtitle thương hiệu trong ngoặc, quy cách/đơn vị, giá lớn (`text-primary`), hiển thị cả `gia_ban` và `gia_thung` (khi có), khay `AddToCartButton` full-width ở đáy card. Nhận prop `priority?: boolean` để đánh dấu ảnh ở trên fold (dùng cho ~4-5 item đầu mỗi grid, tối ưu LCP) |
| `ProductPurchasePanel` | Khối chọn đơn vị/số lượng + nút mua ở trang chi tiết sản phẩm. Tự vẽ thêm thanh giá + nút mua rút gọn dính đáy màn hình (`fixed bottom-0`, chỉ hiện dưới `lg`) — trang chi tiết bọc phần còn lại của component này trong cột `lg:sticky lg:top-24` để có pattern sticky buy-box đầy đủ trên desktop |
| `AddToCartButton` | Khay bo tròn ở đáy `ProductCard` — nút "+" (`bg-cta-soft`) khi sản phẩm chưa có trong giỏ, tự chuyển thành stepper "− số lượng +" (`bg-cta`) khi đã thêm, đọc/ghi trực tiếp qua `useCart()` (không giữ state số lượng riêng) |
| `WeeklyBestSelling` | `"use client"` — section "Bán chạy trong tuần" ở trang chủ: tab pill lọc theo danh mục (state cục bộ, lọc ngay trên `products` truyền qua props, không gọi lại Supabase và không dùng query string — khác `FilterSortBar`) |
| `CartBadge` | Icon giỏ hàng + số lượng, đặt trong `Header`. Từ ≥640px, click sẽ mở `CartDrawer` (qua `useCartDrawer()`) thay vì điều hướng; dưới 640px vẫn là `<Link>` thường tới `/gio-hang` |
| `CartDrawer` | Drawer giỏ hàng trượt từ phải, mở qua `useCartDrawer()` (đặt 1 lần ở `app/(site)/layout.tsx`, cạnh `Header`/`Footer`). Dùng chung `useCart()` — không có state giỏ hàng riêng. Đóng bằng ESC / click nền / nút X, có focus trap cơ bản, `role="dialog"` + `aria-modal` |
| `FilterSortBar` | Thanh lọc dạng dropdown ngang (danh mục/đơn vị/khoảng giá/sắp xếp — mỗi chip là `<select>` native bọc pill + `ChevronDownIcon`), dính (`sticky top-16`) phía trên grid ở `/san-pham`. Đọc/ghi qua query string (`category`, `don_vi`, `gia_tu`, `gia_den`, `sort`, `q`) — trang (Server Component) đọc `searchParams` để lọc/sắp xếp dữ liệu thật, component này không tự giữ danh sách sản phẩm |
| `CheckoutForm` | Form nhập thông tin + submit đơn hàng ở `/thanh-toan`. Tóm tắt đơn dính (`lg:sticky lg:top-24`) bên cạnh form trên desktop, có ghi chú thanh toán VietQR gần nút submit |
| `ClearCartOnMount` | Component ẩn, xóa giỏ hàng khi vào trang đặt hàng thành công |
| `ContactBanner` | Banner liên hệ 2 cột (nền `primary-dark` + ảnh Monin phải + CTA Zalo/hotline), nhận prop `title`/`desc`. Dùng ở section "Liên hệ" trang chủ và cuối trang chi tiết sản phẩm — cùng 1 pattern, chỉ khác nội dung |
| `SearchBox` | `"use client"` — ô tìm kiếm trong `Header` (desktop + mobile, nhận prop `id` để tránh trùng id 2 form), gõ tới đâu gợi ý tới đó: cột "Danh mục" (lọc `CATEGORY_ORDER` tại chỗ, không gọi mạng) + cột "Sản phẩm" (query `public_products` qua `supabase` client, debounce 250ms, giới hạn 5 kết quả). Submit form vẫn hoạt động không cần JS (`action="/san-pham"`, input `name="q"`) — dropdown chỉ là lớp tăng cường phía trên |
| `icons.tsx` (`CartIcon`, `PlusIcon`, `MinusIcon`, `TrashIcon`, `CheckCircleIcon`, `ArrowLeftIcon`, `SearchIcon`, `FilterIcon`, `SortIcon`, `ChevronDownIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `ArrowRightIcon`, `MenuIcon`, `XIcon`, `ShieldCheckIcon`, `TruckIcon`, `ChatIcon`, `NewsIcon`, `BoltIcon`) | Icon SVG dùng chung — **luôn thêm icon mới vào đây, không paste SVG rời trong component khác** |

### Component admin (`components/admin/*.tsx`)

| Component | Việc gì |
|---|---|
| `PasswordChecklist` | Checklist yêu cầu mật khẩu, dùng ở trang đặt/đổi mật khẩu admin |
| `Segmented` | `"use client"` — thanh tab dạng viên thuốc trượt (`items: {key, label, active, onClick}[]`), tách từ `HomeClient.tsx` vì dùng ở ≥2 view. Đang dùng ở "Nhật ký hoạt động", "Chờ duyệt giá" (trong `HomeClient.tsx`) và `OrdersView` |
| `OrdersView` | `"use client"` — view "Đơn hàng" (nav `donhang` trong `HomeClient.tsx`). Đọc/cập nhật trực tiếp bảng `orders`/`order_items` (RLS đã cấp sẵn cho nhân sự nội bộ từ `supabase/migrations/001_orders_and_public_products.sql`), subscribe realtime `postgres_changes` trên `orders` (INSERT/UPDATE) cùng pattern với `NotificationBell`. Tab lọc theo `OrderStatus` qua `Segmented`, modal chi tiết xem `order_items` + đổi trạng thái (ghi `confirmed_at`/`confirmed_by` đúng 1 lần ở lần đổi đầu tiên) |

### Hàm dùng chung public (`lib/*.ts`)

| Hàm/module | Việc gì |
|---|---|
| `products.ts`: `getAllProducts`, `getProductsByCategory`, `getProductById`, `formatVnd` | Đọc dữ liệu sản phẩm (qua view `public_products`) + format tiền VNĐ — **luôn dùng `formatVnd`, không tự viết `toLocaleString` rải rác** |
| `cart.ts`: `loadCart`, `saveCart`, `clearCart`, `cartLineKey` | Đọc/ghi giỏ hàng trong localStorage. `CartItem` (`lib/types.ts`) có `category_sheet` — set khi `addItem()` (từ `product.category_sheet`) để `/gio-hang`, `CartDrawer`, `/thanh-toan` tra được ảnh chất liệu qua `getCategoryImage`. Giỏ hàng cũ đã lưu trước khi có trường này sẽ thiếu field, `getCategoryImage(undefined)` trả `null` an toàn (không crash, chỉ không có ảnh) |
| `bank.ts`: `getBankInfo`, `buildVietQrUrl` | Đọc cấu hình ngân hàng từ env + sinh URL mã VietQR |
| `categories.ts`: `CATEGORY_ORDER`, `categorySlug` | Thứ tự hiển thị danh mục + tạo slug URL |
| `categoryImages.ts`: `getCategoryImage`, `CATEGORY_IMAGES`, `HERO_IMAGE` | Ảnh chất liệu thật (Unsplash, đã xác thực URL tồn tại) đại diện mỗi `category_sheet` — dùng thay placeholder emoji ở `ProductCard`, trang chi tiết sản phẩm, thẻ danh mục trang chủ. Mỗi danh mục có 1-2 ảnh biến thể (`CATEGORY_IMAGES[category]` là mảng); `getCategoryImage(category, seed?)` băm ổn định `seed` (thường truyền `ten_hang_hoa`) để chọn cùng 1 biến thể mỗi lần render — các SKU khác nhau trong cùng danh mục không hiện trùng pixel ảnh. Không truyền `seed` (ví dụ thẻ danh mục trang chủ) → luôn lấy biến thể đầu tiên. Trả `null` nếu danh mục chưa có ảnh xác thực (hiện tại: "Sữa đặc") — nơi gọi phải tự vẽ fallback không-ảnh (nền tông thương hiệu + typography), không bỏ trống/không đoán ảnh sai chủ đề |
| `productImages.ts`: `MONIN_PLAIN`, `MONIN_FRAMED`, `MONIN_ALT` | Ảnh sản phẩm mẫu thật duy nhất hiện có (`public/product images/`, Syrup Chanh Dây MONIN 700ML) — dùng lặp lại cho hero, banner liên hệ, dải khuyến mãi, và gallery PDP khi sản phẩm đang xem đúng là Monin (khớp qua `brand_name`). KHÔNG dùng cho sản phẩm khác không phải Monin — tránh ngụ ý có ảnh thật không tồn tại |
| `news.ts`: `NEWS_ITEMS` | Khung dữ liệu section "Tin tức & Mẹo pha chế" ở trang chủ — placeholder nội dung chung chung (chưa có CMS/bài viết thật), không có route/link riêng. Thay bằng nguồn thật khi có |
| `supabaseClient.ts` | Supabase client phía public (anon key) |
| `CartContext.tsx` (`contexts/`): `CartProvider`, `useCart` | State giỏ hàng toàn cục — mọi thao tác giỏ hàng đi qua `useCart()`, không đọc/ghi `localStorage` trực tiếp ở component |
| `CartDrawerContext.tsx` (`contexts/`): `CartDrawerProvider`, `useCartDrawer` | State UI mở/đóng của `CartDrawer` (không phải dữ liệu giỏ hàng — đó vẫn chỉ ở `CartContext`) |

### Hàm dùng chung admin (`lib/admin/*.ts`)

Đã có sẵn ~32 module (builder xuất Word/Excel/PDF, đồng bộ Google Sheet, auth, activity log...). Trước khi viết thêm logic export/xử lý dữ liệu mới trong `/admin`, kiểm tra `lib/admin/` xem đã có builder/hàm tương tự chưa (ví dụ: cần xuất Excel → xem `excelImport.ts`, `misaBuilder.ts`, `categoryExportBuilder.ts` đã có pattern gì dùng lại được). Riêng `format.ts` (`formatVnd`, `formatDate`) và `types.ts` (thêm `Order`, `OrderItem`, `OrderStatus`, `PaymentMethod` — khớp schema `orders`/`order_items`) là 2 module hay cần tới nhất khi làm thêm UI mới — luôn import từ đây, không viết lại `toLocaleString` rải rác như trước.

## Khi nào tách component là ĐÚNG, khi nào là THỪA

- **Tách khi:** cùng một khối UI (JSX + style + hành vi) xuất hiện ở ≥2 trang/route, hoặc rõ ràng sẽ được tái sử dụng trong roadmap gần (ví dụ: sắp làm thêm trang danh mục khác dùng lại `ProductCard`).
- **Không tách khi:** chỉ 1 trang dùng, không có dấu hiệu lặp lại — tách sớm tạo ra abstraction thừa, khó maintain hơn để inline. Ba dòng JSX giống nhau ở đúng 1 chỗ vẫn tốt hơn một component chỉ có 1 caller.
- **Mở rộng qua props, không fork file:** nếu component gần giống nhưng khác một chi tiết nhỏ (ví dụ `ProductCard` cần thêm biến thể "hết hàng"), thêm prop (`variant`, `disabled`...) vào component hiện có, không tạo `ProductCardV2.tsx` hay `ProductCardOutOfStock.tsx`.
