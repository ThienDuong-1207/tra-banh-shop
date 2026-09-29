-- Chạy trong Supabase SQL Editor của project misa-price-manager (CÙNG 1
-- project với các migration trước, không tạo project mới).
--
-- Toạ độ ƯỚC LƯỢNG (tâm phường/xã khớp từ customer_address, xem
-- lib/admin/geocodeAddress.ts) — phục vụ tính năng "gom tuyến giao hàng theo
-- khoảng cách km" ở trang Shipper. KHÔNG phải toạ độ chính xác từng nhà, chỉ
-- đủ để gom các đơn gần nhau thành 1 tuyến. NULL cho tới khi API
-- /api/admin/orders/geocode-pending chạy khớp được (có thể không khớp được
-- nếu địa chỉ không nhận ra phường/xã nào — để NULL, không suy diễn/đoán).
alter table orders add column if not exists lat double precision;
alter table orders add column if not exists lng double precision;
alter table orders add column if not exists geocoded_ward text;
