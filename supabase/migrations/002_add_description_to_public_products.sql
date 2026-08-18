-- Bổ sung mô tả sản phẩm cho public_products, dùng ở trang chi tiết sản
-- phẩm. Không có cột mô tả riêng trong products — nhưng ten_hoa_don (tên
-- đầy đủ dùng xuất hóa đơn, ví dụ "Nước si rô xoài - Mango syrup nhãn hiệu
-- Monin 700ml") đã có sẵn cho phần lớn sản phẩm (392/397 tại thời điểm viết
-- migration này) và mô tả sản phẩm tốt hơn ten_hang_hoa — dùng lại làm mo_ta
-- thay vì bịa nội dung mới. Sản phẩm chưa có ten_hoa_don sẽ có mo_ta = null,
-- trang chi tiết tự ẩn phần mô tả khi null.
--
-- QUAN TRỌNG: `create or replace view` chỉ cho phép THÊM cột mới vào CUỐI
-- danh sách SELECT — không được chèn giữa hay đổi thứ tự cột đã có, nếu
-- không Postgres báo lỗi 42P16 "cannot change name of view column ... to
-- ...". Bản đầu của file này chèn mo_ta vào giữa (sau ten_hang_hoa) nên bị
-- lỗi đó — đã sửa: 8 cột gốc giữ nguyên thứ tự y hệt migration 001,
-- mo_ta thêm cuối cùng.
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
  p.ten_hoa_don as mo_ta
from products p
left join brands b on b.id = p.brand_id
where p.is_draft = false
  and p.gia_ban is not null;
