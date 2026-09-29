-- Script TEST — KHÔNG phải migration schema, không cần thêm vào lịch sử
-- migration. Chạy thủ công trong Supabase SQL Editor bất cứ khi nào cần dữ
-- liệu đơn hàng giả để kiểm tra tính năng gom tuyến/shipper (chạy lại được
-- nhiều lần, mỗi lần tạo thêm 10 đơn mới).
--
-- Tạo 10 đơn hàng "hôm nay" với khách hàng/địa chỉ GIẢ (rõ ràng là dữ liệu
-- test, không phải khách thật) nhưng SẢN PHẨM là sản phẩm THẬT đang có trong
-- DB (chọn ngẫu nhiên qua subquery — không tự bịa product_id/tên/giá).
-- Địa chỉ chọn sẵn để có cả nhóm gần nhau (test "gom tuyến") lẫn đơn xa lẻ
-- (test "Đơn lẻ") — đã verify khớp được qua lib/admin/geocodeAddress.ts
-- trước khi đưa vào đây.
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
    'Nguyễn Văn An','Trần Thị Bình','Lê Hoàng Cường','Phạm Thị Duyên','Hoàng Văn Em',
    'Vũ Thị Phương','Đặng Văn Giang','Bùi Thị Hoa','Ngô Văn Inh','Đỗ Thị Kim'
  ];
  addresses text[] := array[
    '12 Phan Đình Phùng, Phường Ba Đình, Hà Nội',
    '45 Hoàng Hoa Thám, Phường Ba Đình, Hà Nội',
    '8 Ngọc Hà, Phường Ngọc Hà, Hà Nội',
    '20 Yên Phụ, Phường Hồng Hà, Hà Nội',
    '5 Trấn Vũ, Phường Hồng Hà, Hà Nội',
    '100 Cộng Hòa, Phường Tân Bình, TP.HCM',
    '15 Trường Chinh, Phường Tân Bình, TP.HCM',
    '30 Cách Mạng Tháng 8, Phường Thủ Dầu Một, TP.HCM',
    '789 Trần Phú, Phường Nha Trang, Khánh Hòa',
    '55 Bà Triệu, Phường Ba Đình, Hà Nội'
  ];
  -- 8 đơn "Đang xử lý" (hiện ngay ở hồ chờ nhận của shipper) + 1 "Đã thanh
  -- toán" + 1 "Chờ thanh toán" để trang Đơn hàng cũng có vài trạng thái khác
  -- nhau, không phải test kiểu 1 màu.
  statuses text[] := array[
    'dang_xu_ly','dang_xu_ly','dang_xu_ly','dang_xu_ly',
    'dang_xu_ly','dang_xu_ly','dang_xu_ly','dang_xu_ly',
    'da_thanh_toan','cho_thanh_toan'
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
      statuses[i],
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
