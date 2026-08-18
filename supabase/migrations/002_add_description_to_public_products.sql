-- Bổ sung mô tả sản phẩm cho public_products, dùng ở trang chi tiết sản
-- phẩm. Không có cột mô tả riêng trong products — nhưng ten_hoa_don (tên
-- đầy đủ dùng xuất hóa đơn, ví dụ "Nước si rô xoài - Mango syrup nhãn hiệu
-- Monin 700ml") đã có sẵn cho phần lớn sản phẩm (392/397 tại thời điểm viết
-- migration này) và mô tả sản phẩm tốt hơn ten_hang_hoa — dùng lại làm mo_ta
-- thay vì bịa nội dung mới. Sản phẩm chưa có ten_hoa_don sẽ có mo_ta = null,
-- trang chi tiết tự ẩn phần mô tả khi null.
create or replace view public_products as
select
  p.id,
  p.ten_hang_hoa,
  p.ten_hoa_don as mo_ta,
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
