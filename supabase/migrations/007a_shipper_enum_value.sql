-- Chạy TRƯỚC 007b, trong 1 lần Run RIÊNG — Postgres không cho dùng giá trị
-- enum mới (ADD VALUE) trong cùng transaction với câu lệnh vừa thêm nó
-- (lỗi 55P04 "unsafe use of new value ... must be committed before they can
-- be used"). Chạy xong file này, đợi báo Success, rồi mới chạy 007b.
alter type user_role add value if not exists 'shipper';
