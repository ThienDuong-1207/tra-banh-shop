-- Chạy trong Supabase SQL Editor (cùng project). Gộp role "sales" vào "staff".
-- An toàn chạy lại nhiều lần.
--
-- Postgres không xoá được giá trị khỏi enum user_role, nên giá trị 'sales'
-- vẫn còn trong kiểu nhưng không còn dòng nào dùng và app không cấp nữa.
--
-- Hệ quả: nhân viên cũ role "staff" nay có đủ quyền của "sales" cũ (tạo/sửa
-- sản phẩm, đề xuất đổi giá) — khớp với đề xuất "NHÂN VIÊN".

-- 1. Chuyển tài khoản hiện có.
update profiles set role = 'staff' where role = 'sales';

-- 2. Các policy đang liệt kê 'sales' — thay bằng 'staff' (giữ nguyên phần còn lại).
drop policy if exists "Sales/Admin thêm được sản phẩm mới" on products;
create policy "Sales/Admin thêm được sản phẩm mới" on products
  for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'admin')));

drop policy if exists "Người dùng tạo đề xuất của mình" on price_change_requests;
create policy "Người dùng tạo đề xuất của mình" on price_change_requests
  for insert
  with check (
    proposed_by = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'accountant', 'admin'))
  );

drop policy if exists "Nhân sự nội bộ xem được đơn hàng" on orders;
create policy "Nhân sự nội bộ xem được đơn hàng" on orders
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('accountant', 'admin', 'staff'))
  );

drop policy if exists "Nhân sự nội bộ cập nhật được đơn hàng" on orders;
create policy "Nhân sự nội bộ cập nhật được đơn hàng" on orders
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('accountant', 'admin', 'staff'))
  );
