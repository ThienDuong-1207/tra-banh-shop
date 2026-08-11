-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project, không tạo project Supabase mới) — xem lý do ở
-- documents/ke_hoach_trien_khai_website_ecommerce.md trong repo
-- misa-price-manager. Không đụng tới bảng products/brands hiện có, chỉ
-- thêm bảng/view/policy mới hoàn toàn.

-- ============================================================
-- 1. View công khai — chỉ lộ đúng cột cần cho web bán hàng xem, giấu các
--    cột nội bộ (mã NCC, ghi chú, mã vạch/mã thùng dùng nội bộ...).
--    Chỉ hiện sản phẩm đã có giá bán lẻ và không phải hàng nháp chưa
--    hoàn thiện (is_draft).
-- ============================================================
create or replace view public_products as
select
  p.id,
  p.ten_hang_hoa,
  p.category_sheet,
  p.dvt,
  p.gia_ban,
  p.quy_cach,
  p.gia_thung,
  b.name as brand_name
from products p
left join brands b on b.id = p.brand_id
where p.is_draft = false
  and p.gia_ban is not null;

-- View kế thừa RLS của bảng gốc theo mặc định của Postgres (security_invoker
-- không bật) — cần cấp quyền đọc rõ ràng cho role anon/authenticated:
grant select on public_products to anon, authenticated;

-- ============================================================
-- 2. Đơn hàng từ website — KHÔNG tham chiếu sống tới products.gia_ban, tự
--    lưu lại tên/đơn giá tại đúng thời điểm đặt hàng để không bị sai lệch
--    nếu giá đổi sau đó.
-- ============================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  note text,
  status text not null default 'cho_thanh_toan'
    check (status in ('cho_thanh_toan', 'da_thanh_toan', 'dang_xu_ly', 'dang_giao', 'hoan_thanh', 'huy')),
  payment_method text not null default 'chuyen_khoan'
    check (payment_method in ('chuyen_khoan', 'cod')),
  total_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references profiles(id)
);
create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_status on orders (status);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  ten_hang_hoa text not null,
  don_vi text not null,
  don_gia numeric not null,
  so_luong integer not null check (so_luong > 0),
  thanh_tien numeric not null
);
create index if not exists idx_order_items_order_id on order_items (order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Khách đặt hàng KHÔNG cần đăng nhập (guest checkout) — cho phép insert
-- công khai, nhưng KHÔNG cho đọc lại (tránh dò được đơn của người khác qua
-- id đoán được). Web hiển thị "đặt hàng thành công" dùng thẳng dữ liệu vừa
-- insert trả về (Supabase trả lại row vừa tạo cho chính request đó), không
-- cần quyền SELECT riêng.
drop policy if exists "Ai cũng đặt được đơn hàng" on orders;
create policy "Ai cũng đặt được đơn hàng" on orders
  for insert with check (true);

drop policy if exists "Ai cũng thêm được dòng đơn hàng" on order_items;
create policy "Ai cũng thêm được dòng đơn hàng" on order_items
  for insert with check (true);

-- Chỉ nhân sự nội bộ (đã có role trong profiles — dùng lại đúng bảng
-- profiles của misa-price-manager) mới xem được danh sách đơn, dùng cho
-- mục "Đơn hàng website" trong app quản trị (Phase 3).
drop policy if exists "Nhân sự nội bộ xem được đơn hàng" on orders;
create policy "Nhân sự nội bộ xem được đơn hàng" on orders
  for select using (exists (select 1 from profiles where id = auth.uid() and role is not null));

drop policy if exists "Nhân sự nội bộ xem được dòng đơn hàng" on order_items;
create policy "Nhân sự nội bộ xem được dòng đơn hàng" on order_items
  for select using (exists (select 1 from profiles where id = auth.uid() and role is not null));

drop policy if exists "Nhân sự nội bộ cập nhật được đơn hàng" on orders;
create policy "Nhân sự nội bộ cập nhật được đơn hàng" on orders
  for update using (exists (select 1 from profiles where id = auth.uid() and role is not null));
