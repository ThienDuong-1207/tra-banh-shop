import PolicyPage from "@/components/PolicyPage";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Chính sách bảo mật">
      <h2>Thông tin thu thập</h2>
      <p>
        Khi đặt hàng, website thu thập họ tên, số điện thoại, địa chỉ giao hàng, ghi chú và danh sách sản
        phẩm bạn đặt — chỉ dùng để xử lý và giao đơn hàng.
      </p>

      <h2>Giỏ hàng</h2>
      <p>
        Giỏ hàng được lưu ngay trên trình duyệt của bạn (không gửi lên máy chủ cho đến khi đặt hàng) — website
        chưa có tài khoản đăng nhập khách hàng nên giỏ hàng không gắn với danh tính cá nhân nào.
      </p>

      <h2>Lưu trữ &amp; quyền truy cập</h2>
      <p>
        Thông tin đơn hàng được lưu trữ trên hệ thống của shop, chỉ nhân sự nội bộ được cấp quyền mới xem
        được để xử lý đơn. Thông tin không được chia sẻ cho bên thứ ba ngoài mục đích giao hàng/thanh toán.
      </p>

      <h2>Liên hệ</h2>
      <p>
        Nếu muốn được hỗ trợ liên quan đến dữ liệu cá nhân của mình (xem, chỉnh sửa, yêu cầu xoá), vui lòng
        liên hệ Zalo/Hotline bên dưới.
      </p>
    </PolicyPage>
  );
}
