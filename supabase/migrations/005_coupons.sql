-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project với 001-004, không tạo project mới).
--
-- "Mã khuyến mãi" — thay ô nhập mã ở /thanh-toan hiện LUÔN báo "Mã không
-- hợp lệ" (chưa có bảng thật, chỉ dựng UI trước) bằng hệ thống mã thật.
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  min_order_amount numeric not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);
create index if not exists idx_coupons_code on coupons (code);

alter table coupons enable row level security;

-- Storefront (khách vãng lai, guest checkout) cần đọc để validate mã —
-- không có cột nhạy cảm nào ở đây (không phải giá vốn/NCC như products),
-- nên cho đọc thẳng bảng gốc, không cần view public riêng.
drop policy if exists "Ai cũng xem được coupon" on coupons;
create policy "Ai cũng xem được coupon" on coupons
  for select using (true);

drop policy if exists "Nhân sự nội bộ quản lý coupon" on coupons;
create policy "Nhân sự nội bộ quản lý coupon" on coupons
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role is not null))
  with check (exists (select 1 from profiles where id = auth.uid() and role is not null));

grant select on coupons to anon, authenticated;
grant insert, update, delete on coupons to authenticated;

-- Lưu lại mã đã dùng + số tiền đã giảm TẠI ĐÚNG THỜI ĐIỂM đặt hàng — không
-- tham chiếu sống tới coupons, để sửa/xoá mã sau này không đổi lịch sử đơn
-- đã tạo (cùng triết lý với orders không tham chiếu sống products.gia_ban).
alter table orders add column if not exists coupon_code text;
alter table orders add column if not exists discount_amount numeric not null default 0;
