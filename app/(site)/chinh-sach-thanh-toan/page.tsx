import PolicyPage from "@/components/PolicyPage";

export default function PaymentPolicyPage() {
  return (
    <PolicyPage title="Chính sách thanh toán">
      <p>Hiện tại Trà &amp; Bánh hỗ trợ 2 hình thức thanh toán khi đặt hàng trên website:</p>

      <h2>1. Chuyển khoản qua VietQR</h2>
      <p>
        Sau khi đặt hàng, hệ thống tự sinh mã QR kèm đúng số tiền và nội dung là mã đơn hàng — chỉ cần quét
        bằng app ngân hàng để chuyển khoản. Đơn hàng được xác nhận thủ công sau khi shop nhận được chuyển
        khoản đúng nội dung.
      </p>

      <h2>2. Thanh toán khi nhận hàng (COD)</h2>
      <p>Thanh toán trực tiếp cho shipper bằng tiền mặt khi nhận hàng, áp dụng cho mọi đơn hàng.</p>

      <h2>Về phí giao hàng và thuế</h2>
      <p>
        Phí giao hàng và thuế hiện đang được cập nhật, chưa cộng thêm vào tổng đơn hàng. Giá hiển thị trên
        website là giá sản phẩm cuối cùng.
      </p>
    </PolicyPage>
  );
}
