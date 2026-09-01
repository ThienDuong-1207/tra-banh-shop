import PolicyPage from "@/components/PolicyPage";

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Chính sách giao nhận & kiểm tra hàng">
      <h2>Giao hàng</h2>
      <p>
        Đơn hàng được giao đến đúng địa chỉ bạn nhập khi đặt hàng. Thời gian giao dự kiến hiện chưa có mốc cố
        định — sau khi xác nhận đơn, shop sẽ liên hệ để thông báo thời gian dự kiến cụ thể theo khu vực và
        số lượng đặt.
      </p>

      <h2>Phí giao hàng</h2>
      <p>Phí giao hàng đang được cập nhật, hiện chưa cộng thêm vào tổng đơn hàng.</p>

      <h2>Kiểm tra hàng khi nhận</h2>
      <p>
        Vui lòng kiểm tra số lượng và tình trạng hàng ngay khi nhận. Nếu có sai lệch so với đơn đã đặt, liên
        hệ Zalo/Hotline ngay để được hỗ trợ.
      </p>
    </PolicyPage>
  );
}
