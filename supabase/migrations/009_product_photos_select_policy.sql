-- Chạy trong Supabase SQL Editor (cùng project). An toàn chạy lại nhiều lần.
--
-- Vấn đề: Supabase advisor cảnh báo policy SELECT rộng trên storage.objects
-- cho phép client liệt kê toàn bộ file trong bucket. Bucket product-photos là
-- public nên ảnh vẫn hiển thị qua URL công khai (/storage/v1/object/public/...)
-- mà KHÔNG cần policy SELECT — nên chỉ cần bỏ quyền liệt kê của người lạ.
--
-- Nhân sự nội bộ vẫn cần SELECT (Storage trả về bản ghi vừa insert để xác
-- nhận), nên cấp SELECT riêng cho role đăng nhập có quyền trong profiles.
-- Code upload đã đổi sang upsert:false (đường dẫn là UUID ngẫu nhiên, không
-- bao giờ ghi đè), nên không cần thêm policy UPDATE.

drop policy if exists "Ai cũng xem được ảnh sản phẩm" on storage.objects;

drop policy if exists "Nhân sự nội bộ xem được ảnh sản phẩm" on storage.objects;
create policy "Nhân sự nội bộ xem được ảnh sản phẩm" on storage.objects
  for select to authenticated using (
    bucket_id = 'product-photos'
    and exists (select 1 from profiles where id = auth.uid() and role is not null)
  );

-- Đảm bảo policy INSERT còn đúng (phòng khi đã lỡ xoá nhầm lúc dọn dẹp).
drop policy if exists "Nhân sự nội bộ tải được ảnh sản phẩm" on storage.objects;
create policy "Nhân sự nội bộ tải được ảnh sản phẩm" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-photos'
    and exists (select 1 from profiles where id = auth.uid() and role is not null)
  );

-- Đảm bảo policy DELETE còn đúng (nút "×" xoá ảnh).
drop policy if exists "Nhân sự nội bộ xoá được ảnh sản phẩm" on storage.objects;
create policy "Nhân sự nội bộ xoá được ảnh sản phẩm" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-photos'
    and exists (select 1 from profiles where id = auth.uid() and role is not null)
  );
