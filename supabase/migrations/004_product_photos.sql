-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project với 001/002/003, không tạo project mới).
--
-- "Ảnh sản phẩm" — cho phép gán ảnh THẬT riêng từng SKU thay vì chỉ dùng ảnh
-- minh hoạ chung theo danh mục (lib/categoryImages.ts). Đúng tinh thần
-- "chất liệu thật khi có thể" đã ghi trong PRODUCT.md > Design Principles.
-- Admin tải ảnh dần qua thời gian ở tab "Ảnh sản phẩm" — cột này để NULL cho
-- tới khi có ảnh thật, storefront tự fallback về getCategoryImage khi NULL
-- (không hiện ảnh vỡ/placeholder xám).
alter table products add column if not exists photo_url text;

-- QUAN TRỌNG (đã từng bị lỗi 42P16 ở migration 002): create or replace view
-- chỉ cho phép THÊM cột mới vào CUỐI danh sách SELECT — không được chèn
-- giữa hay đổi thứ tự cột đã có. 9 cột gốc (kể cả mo_ta từ migration 002)
-- giữ nguyên thứ tự, photo_url thêm cuối cùng.
create or replace view public_products as
select
  p.id,
  p.ten_hang_hoa,
  p.category_sheet,
  p.dvt,
  p.gia_ban,
  p.quy_cach,
  p.gia_thung,
  b.name as brand_name,
  p.ten_hoa_don as mo_ta,
  p.photo_url
from products p
left join brands b on b.id = p.brand_id
where p.is_draft = false
  and p.gia_ban is not null;

grant select on public_products to anon, authenticated;

-- Bucket lưu file ảnh — public đọc (ảnh hiển thị thẳng trên storefront qua
-- URL công khai), chỉ nhân sự nội bộ mới upload/xoá được.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

drop policy if exists "Ai cũng xem được ảnh sản phẩm" on storage.objects;
create policy "Ai cũng xem được ảnh sản phẩm" on storage.objects
  for select using (bucket_id = 'product-photos');

drop policy if exists "Nhân sự nội bộ tải được ảnh sản phẩm" on storage.objects;
create policy "Nhân sự nội bộ tải được ảnh sản phẩm" on storage.objects
  for insert with check (
    bucket_id = 'product-photos'
    and exists (select 1 from profiles where id = auth.uid() and role is not null)
  );

drop policy if exists "Nhân sự nội bộ xoá được ảnh sản phẩm" on storage.objects;
create policy "Nhân sự nội bộ xoá được ảnh sản phẩm" on storage.objects
  for delete using (
    bucket_id = 'product-photos'
    and exists (select 1 from profiles where id = auth.uid() and role is not null)
  );
