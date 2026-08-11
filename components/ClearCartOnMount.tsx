"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";

// Đơn đã tạo thành công ở server rồi — dọn giỏ hàng phía client một lần
// khi trang "đặt hàng thành công" hiển thị. Phải đợi CartProvider đọc xong
// localStorage (hydrated=true) trước khi clear(), nếu không effect đọc
// localStorage ở CartProvider (chạy sau, vì đó là effect của component cha)
// sẽ ghi đè giỏ hàng cũ lên state vừa clear().
export default function ClearCartOnMount() {
  const { hydrated, clear } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (!hydrated || cleared.current) return;
    cleared.current = true;
    clear();
  }, [hydrated, clear]);

  return null;
}
