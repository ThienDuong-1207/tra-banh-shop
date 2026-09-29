import wardsData from "./data/vietnamWards.json";
import legacyData from "./data/vietnamWardsLegacy.json";

// Dữ liệu tâm phường/xã Việt Nam — trích từ CSDL nguồn mở
// tranngocminhhieu/vietnamadminunits (MIT license,
// https://github.com/tranngocminhhieu/vietnamadminunits, bảng
// `admin_units`/`admin_units_legacy` trong data/dataset.db, tải & convert
// sang JSON gọn ngày 2026-09-29). Chỉ dùng để ƯỚC LƯỢNG khu vực giao hàng (đủ
// cho gom tuyến theo km), KHÔNG phải toạ độ chính xác từng nhà — sai số có
// thể tới vài km trong cùng phường/xã rộng.
//
// 2 nguồn, thử theo thứ tự ưu tiên:
// 1. `vietnamWards.json` (3.321 phường/xã HIỆN TẠI, sau sáp nhập 7/2025) —
//    chính xác nhất nếu khách gõ địa chỉ theo tên phường/xã mới.
// 2. `vietnamWardsLegacy.json` (phường/xã/quận/huyện CŨ trước sáp nhập,
//    10.035 dòng) — RẤT CẦN vì đa số người vẫn quen gõ địa chỉ kiểu cũ
//    ("Quận 1", "Phường Bến Nghé"...) một thời gian dài sau khi đổi tên
//    hành chính. Thử khớp tới cấp phường/xã cũ trước, không được thì hạ
//    xuống khớp cấp quận/huyện cũ (tâm quận/huyện, thô hơn nhưng vẫn còn hơn
//    không có gì).
type WardEntry = { province: string; provinceKeywords: string[]; ward: string; wardType: string; wardKeywords: string[]; lat: number; lng: number };
type LegacyEntry = {
  province: string;
  provinceKeywords: string[];
  district: string;
  districtKeywords: string[];
  districtLat: number;
  districtLon: number;
  ward: string;
  wardKeywords: string[];
  wardLat: number;
  wardLon: number;
};

const wards = wardsData as WardEntry[];
const legacy = legacyData as LegacyEntry[];

// Bỏ dấu + chữ thường + chỉ giữ chữ/số, khớp đúng kiểu chuẩn hoá đã có sẵn
// trong các cột *Keywords của bộ dữ liệu nguồn.
function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Từ khoá quá ngắn dễ khớp nhầm khi địa chỉ đã bỏ hết dấu cách/dấu câu — chỉ
// tin các khớp đủ dài, và luôn ưu tiên khớp DÀI NHẤT tìm được thay vì khớp
// đầu tiên. Ngưỡng cấp tỉnh/thành thấp hơn hẳn cấp phường/xã vì chỉ có ~34-63
// tỉnh/thành (alias như "hcm"/"hn"/"hue" rất đặc trưng, khó trùng ngẫu
// nhiên) trong khi có tới hàng nghìn phường/xã (tên ngắn dễ khớp nhầm).
const MIN_PROVINCE_KEYWORD_LEN = 2;
const MIN_KEYWORD_LEN = 5;

// Tên tỉnh/thành mới (sau sáp nhập) giống nhau ở cả 2 nguồn — gộp keyword từ
// cả 2 để tra 1 lần duy nhất, chỉ ~34 tỉnh/thành nên rẻ.
const provinceIndex: { province: string; keywords: string[] }[] = (() => {
  const seen = new Map<string, Set<string>>();
  const add = (province: string, keywords: string[]) => {
    if (!seen.has(province)) seen.set(province, new Set());
    for (const k of keywords) seen.get(province)!.add(k);
  };
  for (const w of wards) add(w.province, w.provinceKeywords);
  for (const l of legacy) add(l.province, l.provinceKeywords);
  return [...seen.entries()].map(([province, keywords]) => ({ province, keywords: [...keywords] }));
})();

function findProvince(norm: string): string | null {
  let match: string | null = null;
  let matchLen = 0;
  for (const { province, keywords } of provinceIndex) {
    for (const kw of keywords) {
      if (kw.length >= MIN_PROVINCE_KEYWORD_LEN && kw.length > matchLen && norm.includes(kw)) {
        match = province;
        matchLen = kw.length;
      }
    }
  }
  return match;
}

export type WardMatch = { province: string; ward: string; lat: number; lng: number };

// Best-effort — trả null khi không đủ tin cậy (không suy diễn/đoán bừa khu
// vực, cùng nguyên tắc "không bịa dữ liệu" của dự án). Order không khớp được
// đơn giản là chưa có toạ độ, không tham gia gom tuyến, không hiện sai lệch.
export function matchAddressToWard(address: string): WardMatch | null {
  const norm = normalizeVi(address);
  if (!norm) return null;

  const province = findProvince(norm);

  // 1. Phường/xã hiện tại (sau sáp nhập).
  const currentCandidates = province ? wards.filter((w) => w.province === province) : wards;
  let best: WardMatch | null = null;
  let bestLen = 0;
  for (const w of currentCandidates) {
    for (const kw of w.wardKeywords) {
      if (kw.length >= MIN_KEYWORD_LEN && kw.length > bestLen && norm.includes(kw)) {
        best = { province: w.province, ward: w.ward, lat: w.lat, lng: w.lng };
        bestLen = kw.length;
      }
    }
  }
  if (best) return best;

  // 2. Phường/xã CŨ (trước sáp nhập) — địa chỉ khách gõ theo tên cũ rất phổ
  // biến trong thời gian đầu sau khi đổi tên hành chính.
  const legacyCandidates = province ? legacy.filter((l) => l.province === province) : legacy;
  let bestLegacy: WardMatch | null = null;
  let bestLegacyLen = 0;
  for (const l of legacyCandidates) {
    for (const kw of l.wardKeywords) {
      if (kw.length >= MIN_KEYWORD_LEN && kw.length > bestLegacyLen && norm.includes(kw)) {
        bestLegacy = { province: l.province, ward: `${l.ward} (cũ)`, lat: l.wardLat, lng: l.wardLon };
        bestLegacyLen = kw.length;
      }
    }
  }
  if (bestLegacy) return bestLegacy;

  // 3. Quận/huyện CŨ — thô hơn (tâm cả quận/huyện) nhưng còn hơn không có gì,
  // dùng khi địa chỉ chỉ ghi tên quận/huyện mà không ghi rõ phường/xã.
  let bestDistrict: WardMatch | null = null;
  let bestDistrictLen = 0;
  for (const l of legacyCandidates) {
    for (const kw of l.districtKeywords) {
      if (kw.length >= MIN_KEYWORD_LEN && kw.length > bestDistrictLen && norm.includes(kw)) {
        bestDistrict = { province: l.province, ward: `${l.district} (cũ)`, lat: l.districtLat, lng: l.districtLon };
        bestDistrictLen = kw.length;
      }
    }
  }
  return bestDistrict;
}
