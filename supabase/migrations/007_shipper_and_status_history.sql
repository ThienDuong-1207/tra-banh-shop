-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project với 001-006, không tạo project mới).
--
-- 1) Vai trò "shipper" — mô hình "ai nhận trước được trước" (shared pool):
--    đơn "Đang xử lý" (dang_xu_ly), chưa ai nhận, hiện cho MỌI shipper; bấm
--    "Nhận đơn" tự gán shipper_id = chính mình + chuyển "Đang giao"; bấm
--    "Đã giao" chuyển "Hoàn thành". Shipper dùng trang riêng /admin/shipper,
--    KHÔNG vào được khung admin đầy đủ.
-- 2) order_status_history — ghi lại THẬT mỗi lần đổi trạng thái (giờ +
--    người đổi), phục vụ "Dòng thời gian" ở panel chi tiết OrdersView.
alter type user_role add value if not exists 'shipper';

alter table orders add column if not exists shipper_id uuid references profiles(id);
create index if not exists idx_orders_shipper_id on orders (shipper_id);

-- 2 policy cũ (select/update) trước đây "role is not null" — cho MỌI role
-- kể cả shipper xem/sửa toàn bộ đơn. Siết lại chỉ còn 4 role văn phòng cũ,
-- shipper có policy RIÊNG hẹp hơn ở dưới.
drop policy if exists "Nhân sự nội bộ xem được đơn hàng" on orders;
create policy "Nhân sự nội bộ xem được đơn hàng" on orders
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('sales', 'accountant', 'admin', 'staff'))
  );

drop policy if exists "Nhân sự nội bộ cập nhật được đơn hàng" on orders;
create policy "Nhân sự nội bộ cập nhật được đơn hàng" on orders
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('sales', 'accountant', 'admin', 'staff'))
  );

-- Shipper CHỈ xem: đơn đang chờ nhận (chưa ai nhận) HOẶC đơn đã là của mình
-- — không thấy đơn của shipper khác, không thấy đơn chưa tới bước giao.
drop policy if exists "Shipper xem đơn sẵn sàng giao hoặc của mình" on orders;
create policy "Shipper xem đơn sẵn sàng giao hoặc của mình" on orders
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'shipper')
    and (status = 'dang_xu_ly' or shipper_id = auth.uid())
  );

-- Shipper CHỈ được: (a) tự nhận đơn đang chờ (chưa ai nhận) — kết quả sau
-- khi sửa phải là gán đúng chính mình + chuyển "dang_giao"/"hoan_thanh", (b)
-- cập nhật tiếp đơn đã của mình. Không gán hộ người khác, không tự ý set
-- trạng thái khác ngoài 2 bước giao hàng.
drop policy if exists "Shipper tự nhận và cập nhật đơn của mình" on orders;
create policy "Shipper tự nhận và cập nhật đơn của mình" on orders
  for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'shipper')
    and (shipper_id = auth.uid() or (status = 'dang_xu_ly' and shipper_id is null))
  )
  with check (
    shipper_id = auth.uid()
    and status in ('dang_giao', 'hoan_thanh')
  );

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null check (status in ('cho_thanh_toan', 'da_thanh_toan', 'dang_xu_ly', 'dang_giao', 'hoan_thanh', 'huy')),
  changed_at timestamptz not null default now(),
  changed_by uuid references profiles(id)
);
create index if not exists idx_order_status_history_order_id on order_status_history (order_id);

alter table order_status_history enable row level security;

-- Xem lịch sử đúng phạm vi y hệt được xem đơn đó — subquery orders tự chịu
-- RLS của chính orders theo người gọi hiện tại (staff thấy đủ, shipper chỉ
-- thấy lịch sử đơn sẵn sàng/của mình), không cần lặp lại logic role ở đây.
drop policy if exists "Xem lịch sử theo đúng phạm vi đơn hàng" on order_status_history;
create policy "Xem lịch sử theo đúng phạm vi đơn hàng" on order_status_history
  for select using (
    exists (select 1 from orders o where o.id = order_status_history.order_id)
  );

drop policy if exists "Nhân sự nội bộ ghi lịch sử trạng thái" on order_status_history;
create policy "Nhân sự nội bộ ghi lịch sử trạng thái" on order_status_history
  for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role is not null)
    and exists (select 1 from orders o where o.id = order_status_history.order_id)
  );

grant select, insert on order_status_history to authenticated;
