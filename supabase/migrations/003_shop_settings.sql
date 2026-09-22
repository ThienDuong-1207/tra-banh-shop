-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project với 001/002, không tạo project mới).
--
-- "Cài đặt cửa hàng" — chuyển GPKD/địa chỉ từ hardcode trong
-- lib/shopInfo.ts sang bảng thật, để admin điền/sửa qua UI mà không cần
-- sửa code + deploy lại mỗi lần có thông tin thật. Bảng chỉ có ĐÚNG 1 dòng
-- (singleton) — dùng "id boolean primary key default true, check (id)" để
-- Postgres tự chặn insert dòng thứ 2.
create table if not exists shop_settings (
  id boolean primary key default true check (id),
  gpkd_number text not null default '',
  addresses text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

insert into shop_settings (id) values (true) on conflict (id) do nothing;

alter table shop_settings enable row level security;

-- Storefront (khách vãng lai, chưa đăng nhập) cần đọc để hiện ở Footer —
-- cùng tinh thần public_products: lộ đúng cột cần cho web bán hàng.
drop policy if exists "Ai cũng xem được cài đặt cửa hàng" on shop_settings;
create policy "Ai cũng xem được cài đặt cửa hàng" on shop_settings
  for select using (true);

-- Chỉ nhân sự nội bộ (đã có role trong profiles) mới sửa được.
drop policy if exists "Nhân sự nội bộ sửa được cài đặt cửa hàng" on shop_settings;
create policy "Nhân sự nội bộ sửa được cài đặt cửa hàng" on shop_settings
  for update using (exists (select 1 from profiles where id = auth.uid() and role is not null))
  with check (exists (select 1 from profiles where id = auth.uid() and role is not null));

grant select on shop_settings to anon, authenticated;
grant update on shop_settings to authenticated;
