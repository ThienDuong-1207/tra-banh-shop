// Thông tin ngân hàng để sinh mã VietQR — cấu hình qua biến môi trường
// BANK_ID/BANK_ACCOUNT_NO/BANK_ACCOUNT_NAME (đọc phía server, không cần
// tiền tố NEXT_PUBLIC_ vì chỉ dùng trong trang thành công là Server
// Component). Chưa cấu hình thì trang thành công vẫn hiển thị được, chỉ
// ẩn phần QR và hướng dẫn khách liên hệ trực tiếp — không chặn build/deploy.
export type BankInfo = {
  bankId: string;
  accountNo: string;
  accountName: string;
};

export function getBankInfo(): BankInfo | null {
  const bankId = process.env.BANK_ID;
  const accountNo = process.env.BANK_ACCOUNT_NO;
  const accountName = process.env.BANK_ACCOUNT_NAME;
  if (!bankId || !accountNo || !accountName) return null;
  return { bankId, accountNo, accountName };
}

export function buildVietQrUrl(bank: BankInfo, amount: number, orderCode: string): string {
  const addInfo = encodeURIComponent(orderCode);
  const accountName = encodeURIComponent(bank.accountName);
  return `https://img.vietqr.io/image/${bank.bankId}-${bank.accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}
