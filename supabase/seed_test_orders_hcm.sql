-- Script TEST — KHÔNG phải migration schema, không cần thêm vào lịch sử
-- migration. Chạy thủ công trong Supabase SQL Editor khi cần dữ liệu đơn
-- hàng tập trung ở TP.HCM (đa phần khách thật ở khu vực này) để kiểm tra kỹ
-- thuật toán gom tuyến giao hàng theo khoảng cách km — xem
-- supabase/seed_test_orders.sql cho bản trải rộng nhiều tỉnh/thành.
--
-- 10 phường ở TP.HCM (sau sáp nhập 7/2025) đã tính trước khoảng cách thật
-- (haversine) để tạo đúng 2 cụm rõ ràng + 4 đơn lẻ ở bán kính gom mặc định
-- 3km (lib/admin/routeClustering.ts):
--   Cụm 1 (~1.3-2.7km nhau): Cầu Ông Lãnh, Bến Thành, Sài Gòn
--   Cụm 2 (~2.2-2.5km nhau): Tân Định, Phú Nhuận, Bình Thạnh
--   Đơn lẻ (đều >5km cách cụm gần nhất): Tân Bình, Bình Tân, Gò Vấp, Thủ Đức
-- Khách hàng/SĐT là dữ liệu GIẢ rõ ràng cho mục đích test; sản phẩm mỗi đơn
-- là sản phẩm THẬT trong DB (chọn ngẫu nhiên qua subquery, không tự bịa).
do $$
declare
  v_order_id uuid;
  v_order_code text;
  v_created_at timestamptz;
  v_today_start timestamptz := date_trunc('day', now());
  v_total numeric;
  v_item_count int;
  v_qty int;
  v_line_total numeric;
  v_product record;
  i int;
  j int;
  names text[] := array[
    'Lý Thị Ngọc','Trương Văn Phúc','Đinh Thị Quyên','Phan Văn Rin','Võ Thị Sang',
    'Huỳnh Văn Tâm','Mai Thị Uyên','Dương Văn Việt','Lâm Thị Xuân','Châu Văn Yên'
  ];
  addresses text[] := array[
    '4 Nguyễn Thái Học, Phường Cầu Ông Lãnh, TP.HCM',
    '19 Lê Lợi, Phường Bến Thành, TP.HCM',
    '88 Hai Bà Trưng, Phường Sài Gòn, TP.HCM',
    '27 Đinh Tiên Hoàng, Phường Tân Định, TP.HCM',
    '60 Phan Xích Long, Phường Phú Nhuận, TP.HCM',
    '150 Điện Biên Phủ, Phường Bình Thạnh, TP.HCM',
    '200 Cộng Hòa, Phường Tân Bình, TP.HCM',
    '35 Kinh Dương Vương, Phường Bình Tân, TP.HCM',
    '10 Quang Trung, Phường Gò Vấp, TP.HCM',
    '5 Võ Văn Ngân, Phường Thủ Đức, TP.HCM'
  ];
  payments text[] := array['chuyen_khoan','cod'];
begin
  for i in 1..10 loop
    v_created_at := v_today_start + (random() * (now() - v_today_start));
    v_order_code := 'DH' || to_char(v_created_at, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    v_total := 0;

    insert into orders (order_code, customer_name, customer_phone, customer_address, status, payment_method, total_amount, created_at)
    values (
      v_order_code,
      names[i],
      '09' || floor(random() * 90000000 + 10000000)::text,
      addresses[i],
      'dang_xu_ly',
      payments[1 + floor(random() * 2)::int],
      0,
      v_created_at
    )
    returning id into v_order_id;

    v_item_count := 1 + floor(random() * 3)::int; -- 1-3 dòng sản phẩm mỗi đơn
    for j in 1..v_item_count loop
      select id, ten_hang_hoa, dvt, gia_ban into v_product
      from products
      where gia_ban is not null and is_draft = false
      order by random()
      limit 1;

      if v_product.id is not null then
        v_qty := 1 + floor(random() * 5)::int;
        v_line_total := v_product.gia_ban * v_qty;
        insert into order_items (order_id, product_id, ten_hang_hoa, don_vi, don_gia, so_luong, thanh_tien)
        values (v_order_id, v_product.id, v_product.ten_hang_hoa, coalesce(v_product.dvt, 'cái'), v_product.gia_ban, v_qty, v_line_total);
        v_total := v_total + v_line_total;
      end if;
    end loop;

    update orders set total_amount = v_total where id = v_order_id;
  end loop;
end $$;
