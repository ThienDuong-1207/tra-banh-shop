-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project với 001-005, không tạo project mới).
--
-- Thêm role "staff" — nhân viên vận hành (đóng gói/giao hàng/CSKH). Phạm vi
-- đã chốt với chủ dự án: xem Tổng quan/Khách hàng, xem + đổi trạng thái Đơn
-- hàng, CHỈ XEM giá sản phẩm (không sửa field/không đề xuất đổi giá), không
-- vào được Ảnh sản phẩm/Cài đặt cửa hàng/Mã khuyến mãi/Quản lý người dùng.
--
-- LƯU Ý: ALTER TYPE ... ADD VALUE không được nằm cùng transaction với lệnh
-- nào DÙNG giá trị mới đó — các policy bên dưới không tham chiếu 'staff'
-- trực tiếp (staff bị loại theo kiểu "không có trong allow-list", không
-- phải bị chặn tường minh) nên an toàn chạy chung 1 lần.
alter type user_role add value if not exists 'staff';

-- price_change_requests: trước đây "role is not null" cho phép MỌI role đã
-- cấp quyền tạo đề xuất đổi giá (xem comment gốc ở schema.sql) — staff là
-- role hạn chế hơn, chỉ xem giá, không được tạo đề xuất. Siết lại đúng 3
-- role cũ, loại staff ra.
drop policy if exists "Người dùng tạo đề xuất của mình" on price_change_requests;
create policy "Người dùng tạo đề xuất của mình" on price_change_requests
  for insert
  with check (
    proposed_by = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('sales', 'accountant', 'admin'))
  );

-- shop_settings/coupons: policy cũ (migration 003/005) dùng "role is not
-- null" — lỡ cho phép MỌI role (kể cả staff, và cả sales/accountant vốn
-- không thấy 2 tab này trên UI) ghi thẳng qua console trình duyệt. Siết lại
-- đúng ý định ban đầu, khớp với gate "role === 'admin'" đã có sẵn ở
-- ShopSettingsView/CouponsView phía UI — RLS giờ mới thực sự là ranh giới
-- bảo mật, không chỉ dựa vào việc ẩn nút trên giao diện.
drop policy if exists "Nhân sự nội bộ sửa được cài đặt cửa hàng" on shop_settings;
create policy "Nhân sự nội bộ sửa được cài đặt cửa hàng" on shop_settings
  for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Nhân sự nội bộ quản lý coupon" on coupons;
create policy "Nhân sự nội bộ quản lý coupon" on coupons
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
