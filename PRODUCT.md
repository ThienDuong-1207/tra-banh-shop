# Product

## Register

brand

## Users

Chủ/nhân viên thu mua của các cơ sở F&B tại Việt Nam — quán trà sữa, quán cà phê, tiệm bánh, bar nhỏ — mua nguyên liệu pha chế (sữa, syrup, bột, kem béo, kem đông lạnh, trà, trân châu, mứt...) theo hình thức sỉ và lẻ. Bối cảnh sử dụng: tra cứu nhanh trên điện thoại hoặc desktop để đặt lại (re-order) những mặt hàng quen thuộc, hoặc tìm nguyên liệu mới khi mở món/mùa vụ mới. Người mua quan tâm giá theo quy cách (thùng/lẻ), có sẵn hàng hay không, và thường cần tư vấn thêm qua Zalo trước khi chốt đơn số lượng lớn. Thứ yếu: khách lẻ mua số lượng nhỏ để dùng tại nhà.

## Product Purpose

Website bán nguyên liệu pha chế trực tuyến: duyệt theo danh mục, xem giá/quy cách, thêm giỏ hàng, thanh toán qua chuyển khoản VietQR, nhận xác nhận đơn hàng. Thành công là khách hàng B2B tìm và đặt lại nguyên liệu quen thuộc trong dưới 2 phút mà không cần gọi điện, đồng thời truyền tải được sự chuyên nghiệp/đáng tin cậy của một nhà cung cấp nguyên liệu F&B (không phải một quầy tạp hoá lẻ).

## Brand Personality

Chuyên nghiệp, chắc chắn, giàu chất liệu (tactile) — cảm giác của một nhà cung cấp nguyên liệu lâu năm mà chủ quán tin tưởng đặt hàng định kỳ, không phải một app tạp hoá đại trà. Giọng nói: trực tiếp, rõ ràng, tôn trọng thời gian của người mua sỉ (không màu mè, không sales-y).

**Cập nhật (ghi đè quyết định trước về màu sắc):** phần "ấm áp đến từ chất liệu, không đến từ màu pastel ngọt ngào kiểu grocery app" ở trên đã bị chủ dự án đảo ngược — sau khi thử hướng "sang trọng, trầm" (đỏ đô đậm `#6b1420` + CTA ô-liu trầm), phản hồi trực tiếp là **màu quá tối**, muốn bảng màu **tươi, bắt mắt, đúng tinh thần thương mại điện tử** (tham khảo: đỏ tươi bão hoà kiểu Coca-Cola/KFC — quen thuộc trong ngành F&B, gợi cảm giác ngon miệng/năng động). Bảng màu hiện hành (xem `app/globals.css`): `primary #c92e3b` (đỏ tươi, không còn là đỏ đô nặng), `cta #82bb4c` (xanh lá tươi), `accent #fbb61b` (gold sáng). Đây là chỉ đạo trực tiếp của khách hàng, không tự ý làm trầm lại màu sắc nữa trừ khi được yêu cầu lại. Chất liệu/texture (syrup, bột, kem) và văn hoá trà/bánh Việt vẫn là nguồn cảm hứng cho hình ảnh/copy, chỉ riêng bảng màu là không né tránh độ tươi/bắt mắt như trước.

## Anti-references

- App tạp hoá tiêu dùng nhanh (Instacart/GrabMart-style) — đối tượng ở đây là người mua sỉ B2B, không phải người tiêu dùng cuối mua vài món lặt vặt.
- Placeholder emoji (🍵) thay ảnh sản phẩm — dùng ảnh sản phẩm thật (dù mới có 1 sản phẩm mẫu) thay vì emoji.

**Cập nhật (ghi đè quyết định trước):** dự án trước đó có 2 phương án được thử: (1) một hướng thiết kế "distinctive" tự đề xuất né khỏi mô-típ grocery-kit — đã bị thay thế; (2) quyết định hiện tại của chủ dự án là **nhân bản gần như 1:1 layout của Gromuse** (UI kit gốc trong `trabanh/documents/prompt_thiet_ke_uiux_website_ecommerce.md`, video tham khảo `public/videos_ecomerce`), chỉ đổi màu thương hiệu chính (header/hero/trạng thái active) từ xanh rêu sang đỏ đô `#6b1420`. Đây là chỉ đạo trực tiếp, rõ ràng của khách hàng — không tự ý "cải tiến" xa khỏi layout Gromuse nữa trừ khi được yêu cầu lại. Giữ nguyên: nút CTA xanh lá, dải khuyến mãi đa màu pastel, banner tải app tím, card bo góc, nút "+"/stepper dạng khay.

## Design Principles

1. **Đặt lại nhanh hơn khám phá chậm** — ưu tiên tốc độ tìm/lọc/đặt lại cho khách quen thuộc, không thiết kế hành trình khám phá kiểu marketing dài dòng.
2. **Tin cậy qua sự rõ ràng, không qua trang trí** — giá, quy cách, tồn kho phải rõ ràng ngay từ card sản phẩm; sự tin cậy đến từ thông tin chính xác, không từ badge/sao đánh giá giả.
3. **Chất liệu thật, kể cả khi chưa có ảnh thật** — hệ thống thiết kế (màu, texture, typography) phải gợi được chất liệu nguyên liệu pha chế thay vì dựa vào ảnh sản phẩm để tải cảm xúc.
4. **Một điểm nhấn, phần còn lại kỷ luật** — theo đúng nguyên tắc "restraint" của impeccable: chọn một signature element cho mỗi trang, phần còn lại phục vụ tốc độ thao tác.
5. **B2B trước, nhưng không lạnh lùng như dashboard nội bộ** — vẫn là trang `brand` (bán hàng), không biến thành công cụ quản trị khô khan.

## Icon Sourcing

Được phép dùng **Material Symbols** (Google Fonts icons, `fonts.google.com/icons`) — giấy phép Apache 2.0, miễn phí thương mại, không bắt buộc credit. Cách dùng: tải file SVG cụ thể về và dán inline vào `components/icons.tsx` theo đúng pattern icon hiện có (component riêng, `className` prop, `currentColor`) — **không** nhúng `<link>` tới stylesheet/font Material Symbols của Google (tránh network request runtime tới CDN ngoài, đi ngược lại cách font chữ đang tự host qua `next/font/google` ở build-time). Icon hiện có trong `icons.tsx` là dạng `stroke` (viền nét, `strokeWidth 1.8`, `fill="none"`), còn Material Symbols xuất ra dạng `fill` (khối đặc) — khi thêm icon mới từ Material Symbols cần so cạnh icon cũ để khớp độ đậm nhạt nét, tránh lệch cỡ trong cùng 1 giao diện.

## Accessibility & Inclusion

WCAG AA: contrast ≥4.5:1 cho body text, ≥3:1 cho text lớn. Touch target ≥44px (đối tượng thao tác trên điện thoại khi ở quầy/kho). Font hỗ trợ đầy đủ dấu tiếng Việt (đã dùng Be Vietnam Pro). Tôn trọng `prefers-reduced-motion`. Không yêu cầu đặc biệt khác được nêu.
